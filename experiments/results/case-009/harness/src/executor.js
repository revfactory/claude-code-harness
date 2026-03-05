'use strict';

const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Planner } = require('./planner');
const { ExpressionEvaluator } = require('./expression');
const { Aggregator } = require('./aggregator');

class Executor {
  constructor(storage) {
    this.storage = storage;
    this.evaluator = new ExpressionEvaluator(this);
    this.aggregator = new Aggregator(this.evaluator);
    this.planner = new Planner();
  }

  /**
   * Execute a SQL string. Returns array of results.
   */
  execute(sql) {
    const lexer = new Lexer(sql);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const statements = parser.parse();

    const results = [];
    for (const stmt of statements) {
      results.push(this.executeStatement(stmt));
    }
    return results.length === 1 ? results[0] : results;
  }

  executeStatement(stmt) {
    switch (stmt.type) {
      case 'CreateTableStatement': return this.executeCreateTable(stmt);
      case 'DropTableStatement': return this.executeDropTable(stmt);
      case 'InsertStatement': return this.executeInsert(stmt);
      case 'UpdateStatement': return this.executeUpdate(stmt);
      case 'DeleteStatement': return this.executeDelete(stmt);
      case 'SelectStatement': return this.executeSelect(stmt);
      default:
        throw new Error(`Unknown statement type: ${stmt.type}`);
    }
  }

  // ── DDL ─────────────────────────────────────────────────
  executeCreateTable(stmt) {
    this.storage.createTable(stmt.name, stmt.columns);
    return { type: 'CREATE', message: `Table '${stmt.name}' created` };
  }

  executeDropTable(stmt) {
    this.storage.dropTable(stmt.name);
    return { type: 'DROP', message: `Table '${stmt.name}' dropped` };
  }

  // ── DML ─────────────────────────────────────────────────
  executeInsert(stmt) {
    let count = 0;
    for (const valueRow of stmt.values) {
      const evaluatedValues = valueRow.map(expr => this.evaluator.evaluate(expr, {}));
      this.storage.insertRow(stmt.table, stmt.columns, evaluatedValues);
      count++;
    }
    return { type: 'INSERT', rowsAffected: count };
  }

  executeUpdate(stmt) {
    const evaluate = this.evaluator;
    const predicate = stmt.where ? (row) => evaluate.isTruthy(evaluate.evaluate(stmt.where, row)) : null;

    const rows = this.storage.getTable(stmt.table);
    let count = 0;
    for (const row of rows) {
      if (!predicate || predicate(row)) {
        for (const assign of stmt.assignments) {
          row[assign.column] = evaluate.evaluate(assign.value, row);
        }
        count++;
      }
    }
    return { type: 'UPDATE', rowsAffected: count };
  }

  executeDelete(stmt) {
    const evaluate = this.evaluator;
    const predicate = stmt.where ? (row) => evaluate.isTruthy(evaluate.evaluate(stmt.where, row)) : null;
    const count = this.storage.deleteRows(stmt.table, predicate);
    return { type: 'DELETE', rowsAffected: count };
  }

  // ── SELECT ──────────────────────────────────────────────
  executeSelect(ast) {
    const plan = this.planner.planSelect(ast);
    const rows = this.executePlan(plan);
    return { type: 'SELECT', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] };
  }

  executePlan(plan) {
    switch (plan.type) {
      case 'SeqScan': return this.execSeqScan(plan);
      case 'DualScan': return [{}]; // single empty row for expressions
      case 'Filter': return this.execFilter(plan);
      case 'Join': return this.execJoin(plan);
      case 'Aggregate': return this.execAggregate(plan);
      case 'Sort': return this.execSort(plan);
      case 'Project': return this.execProject(plan);
      case 'Limit': return this.execLimit(plan);
      default:
        throw new Error(`Unknown plan node: ${plan.type}`);
    }
  }

  // ── Plan Executors ──────────────────────────────────────

  execSeqScan(plan) {
    const rows = this.storage.getTable(plan.table);
    const alias = plan.alias || plan.table;

    // Add qualified names (alias.column) to each row
    return rows.map(row => {
      const qualified = { ...row };
      if (alias) {
        for (const [key, val] of Object.entries(row)) {
          if (!key.includes('.')) {
            qualified[`${alias}.${key}`] = val;
          }
        }
      }
      return qualified;
    });
  }

  execFilter(plan) {
    const rows = this.executePlan(plan.input);
    return rows.filter(row => this.evaluator.isTruthy(this.evaluator.evaluate(plan.predicate, row)));
  }

  execJoin(plan) {
    const leftRows = this.executePlan(plan.left);
    const rightRows = this.executePlan(plan.right);

    if (plan.joinType === 'LEFT') {
      return this.leftJoin(leftRows, rightRows, plan.on, plan.right);
    }
    return this.innerJoin(leftRows, rightRows, plan.on);
  }

  innerJoin(leftRows, rightRows, condition) {
    const result = [];
    for (const left of leftRows) {
      for (const right of rightRows) {
        const merged = { ...left, ...right };
        if (this.evaluator.isTruthy(this.evaluator.evaluate(condition, merged))) {
          result.push(merged);
        }
      }
    }
    return result;
  }

  leftJoin(leftRows, rightRows, condition, rightPlan) {
    const result = [];
    // Determine right-side columns for NULL fill
    let rightCols = [];
    if (rightRows.length > 0) {
      rightCols = Object.keys(rightRows[0]);
    } else if (rightPlan && rightPlan.table) {
      const schema = this.storage.getSchema(rightPlan.table);
      const alias = rightPlan.alias || rightPlan.table;
      rightCols = schema.map(c => c.name);
      rightCols = rightCols.concat(rightCols.map(c => `${alias}.${c}`));
    }

    for (const left of leftRows) {
      let matched = false;
      for (const right of rightRows) {
        const merged = { ...left, ...right };
        if (this.evaluator.isTruthy(this.evaluator.evaluate(condition, merged))) {
          result.push(merged);
          matched = true;
        }
      }
      if (!matched) {
        const nullRight = {};
        for (const col of rightCols) {
          nullRight[col] = null;
        }
        result.push({ ...left, ...nullRight });
      }
    }
    return result;
  }

  execAggregate(plan) {
    const rows = this.executePlan(plan.input);
    return this.aggregator.aggregate(rows, plan.groupBy, plan.aggregates);
  }

  execSort(plan) {
    const rows = this.executePlan(plan.input);
    const orderBy = plan.orderBy;

    return [...rows].sort((a, b) => {
      for (const item of orderBy) {
        const va = this.evaluator.evaluate(item.expr, a);
        const vb = this.evaluator.evaluate(item.expr, b);

        // NULLs last
        if (va === null && vb === null) continue;
        if (va === null) return 1;
        if (vb === null) return -1;

        let cmp = 0;
        if (typeof va === 'string' && typeof vb === 'string') {
          cmp = va.localeCompare(vb);
        } else {
          cmp = va < vb ? -1 : va > vb ? 1 : 0;
        }

        if (cmp !== 0) {
          return item.direction === 'DESC' ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  execProject(plan) {
    const rows = this.executePlan(plan.input);
    const columns = plan.columns;

    // Check if it's SELECT *
    if (columns.length === 1 && columns[0].expr.type === 'Column' && columns[0].expr.name === '*' && !columns[0].expr.table) {
      // Return rows with only original (unqualified) column names
      const projected = rows.map(row => {
        const result = {};
        for (const [key, val] of Object.entries(row)) {
          if (!key.includes('.') && !key.startsWith('__agg_')) {
            result[key] = val;
          }
        }
        return result;
      });
      return plan.distinct ? this.removeDuplicates(projected) : projected;
    }

    const projected = rows.map(row => {
      const result = {};
      for (const col of columns) {
        // Handle table.* expansion
        if (col.expr.type === 'Column' && col.expr.name === '*' && col.expr.table) {
          const prefix = col.expr.table + '.';
          for (const [key, val] of Object.entries(row)) {
            if (key.startsWith(prefix)) {
              result[key.slice(prefix.length)] = val;
            }
          }
          continue;
        }

        const val = this.evaluator.evaluate(col.expr, row);
        const name = col.alias || this.getColumnName(col.expr);
        result[name] = val;
      }
      return result;
    });

    return plan.distinct ? this.removeDuplicates(projected) : projected;
  }

  getColumnName(expr) {
    switch (expr.type) {
      case 'Column': return expr.name;
      case 'Aggregate': {
        const argStr = expr.arg === '*' ? '*' :
          (expr.arg && expr.arg.distinct) ? `DISTINCT ${this.evaluator.exprToString(expr.arg.expr)}` :
          this.evaluator.exprToString(expr.arg);
        return `${expr.fn}(${argStr})`;
      }
      case 'BinaryExpr': return `${this.getColumnName(expr.left)}${expr.op}${this.getColumnName(expr.right)}`;
      default: return this.evaluator.exprToString(expr);
    }
  }

  removeDuplicates(rows) {
    const seen = new Set();
    return rows.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  execLimit(plan) {
    const rows = this.executePlan(plan.input);
    const offset = plan.offset || 0;
    const limit = plan.limit != null ? plan.limit : rows.length;
    return rows.slice(offset, offset + limit);
  }
}

module.exports = { Executor };

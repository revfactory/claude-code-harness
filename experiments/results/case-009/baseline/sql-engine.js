// In-Memory SQL Query Engine for Node.js
// Supports: DDL, DML, SELECT with WHERE/ORDER BY/LIMIT/GROUP BY/HAVING/JOIN/Subquery

class Database {
  constructor() {
    this.tables = {};
  }

  execute(sql) {
    const tokens = tokenize(sql);
    const ast = parse(tokens);
    return this._exec(ast);
  }

  _exec(ast) {
    switch (ast.type) {
      case 'CREATE_TABLE': return this._createTable(ast);
      case 'DROP_TABLE': return this._dropTable(ast);
      case 'INSERT': return this._insert(ast);
      case 'SELECT': return this._select(ast);
      case 'UPDATE': return this._update(ast);
      case 'DELETE': return this._delete(ast);
      default: throw new Error(`Unknown statement type: ${ast.type}`);
    }
  }

  _createTable(ast) {
    if (this.tables[ast.table]) throw new Error(`Table ${ast.table} already exists`);
    this.tables[ast.table] = { columns: ast.columns, rows: [] };
    return { success: true, message: `Table ${ast.table} created` };
  }

  _dropTable(ast) {
    if (!this.tables[ast.table]) throw new Error(`Table ${ast.table} does not exist`);
    delete this.tables[ast.table];
    return { success: true, message: `Table ${ast.table} dropped` };
  }

  _insert(ast) {
    const table = this.tables[ast.table];
    if (!table) throw new Error(`Table ${ast.table} does not exist`);
    const cols = ast.columns || table.columns.map(c => c.name);
    const row = {};
    for (const col of table.columns) {
      row[col.name] = null;
    }
    for (let i = 0; i < cols.length; i++) {
      const colDef = table.columns.find(c => c.name.toLowerCase() === cols[i].toLowerCase());
      if (!colDef) throw new Error(`Column ${cols[i]} not found`);
      row[colDef.name] = castValue(ast.values[i], colDef.type);
    }
    table.rows.push(row);
    return { success: true, message: `1 row inserted` };
  }

  _resolveTableRows(source) {
    // source can be a table name or a join structure
    if (typeof source === 'string') {
      const t = this.tables[source];
      if (!t) throw new Error(`Table ${source} does not exist`);
      return { rows: t.rows.map(r => ({ [source]: r })), aliases: { [source]: source } };
    }
    if (source.type === 'JOIN') {
      return this._resolveJoin(source);
    }
    throw new Error('Unknown source type');
  }

  _resolveJoin(join) {
    const leftResult = this._resolveTableRows(join.left);
    const rightTable = join.right;
    const rightAlias = join.rightAlias || rightTable;
    const rt = this.tables[rightTable];
    if (!rt) throw new Error(`Table ${rightTable} does not exist`);

    const rows = [];
    for (const leftRow of leftResult.rows) {
      let matched = false;
      for (const rightRow of rt.rows) {
        const combined = { ...leftRow, [rightAlias]: rightRow };
        // Flatten combined for ON evaluation
        const flatCombined = {};
        for (const [tbl, cols] of Object.entries(combined)) {
          if (typeof cols === 'object' && cols !== null) {
            for (const [col, val] of Object.entries(cols)) {
              flatCombined[col] = val;
              flatCombined[`${tbl}.${col}`] = val;
            }
          }
        }
        flatCombined.__tables__ = combined;
        if (evaluateExpr(join.on, flatCombined, this)) {
          rows.push(combined);
          matched = true;
        }
      }
      if (!matched && join.joinType === 'LEFT') {
        const nullRow = {};
        for (const col of rt.columns) nullRow[col.name] = null;
        rows.push({ ...leftRow, [rightAlias]: nullRow });
      }
    }
    return { rows, aliases: { ...leftResult.aliases, [rightAlias]: rightTable } };
  }

  _select(ast) {
    // Handle FROM
    let rows;
    if (ast.from) {
      const result = this._resolveTableRows(ast.from);
      // Flatten rows: { tableName: {col: val} } -> flat {col: val} with table prefix available
      rows = result.rows.map(r => {
        const flat = {};
        const prefixed = {};
        for (const [tbl, cols] of Object.entries(r)) {
          for (const [col, val] of Object.entries(cols)) {
            flat[col] = val;
            prefixed[`${tbl}.${col}`] = val;
          }
        }
        return { ...flat, ...prefixed, __tables__: r };
      });
    } else {
      rows = [{}];
    }

    // WHERE
    if (ast.where) {
      rows = rows.filter(row => evaluateExpr(ast.where, row, this));
    }

    // GROUP BY
    if (ast.groupBy) {
      const groups = new Map();
      for (const row of rows) {
        const key = ast.groupBy.map(g => {
          const v = evaluateExpr(g, row, this);
          return v === null ? '__NULL__' : v;
        }).join('|||');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      }

      rows = [];
      for (const [, groupRows] of groups) {
        const representative = { ...groupRows[0], __group__: groupRows };
        rows.push(representative);
      }

      // HAVING
      if (ast.having) {
        rows = rows.filter(row => evaluateExpr(ast.having, row, this));
      }
    } else {
      // If there are aggregate functions but no GROUP BY, treat all rows as one group
      const hasAgg = ast.columns.some(c => c.expr && c.expr.type === 'AGGREGATE');
      if (hasAgg && rows.length > 0) {
        rows = [{ ...rows[0], __group__: rows }];
      } else if (hasAgg && rows.length === 0) {
        rows = [{ __group__: [] }];
      }
    }

    // SELECT columns - project but keep source row for ORDER BY
    const resultRows = rows.map(row => {
      const out = {};
      for (const col of ast.columns) {
        if (col.star) {
          for (const [k, v] of Object.entries(row)) {
            if (!k.includes('.') && k !== '__tables__' && k !== '__group__') {
              out[k] = v;
            }
          }
        } else {
          const val = evaluateExpr(col.expr, row, this);
          const name = col.alias || exprToName(col.expr);
          out[name] = val;
        }
      }
      return { __projected__: out, __source__: row };
    });

    // ORDER BY (using source row data so we can sort by non-projected columns)
    if (ast.orderBy) {
      resultRows.sort((a, b) => {
        for (const ob of ast.orderBy) {
          // Try projected first, then source
          let aVal = a.__projected__[ob.column];
          let bVal = b.__projected__[ob.column];
          if (aVal === undefined) aVal = a.__source__[ob.column] !== undefined ? a.__source__[ob.column] : null;
          if (bVal === undefined) bVal = b.__source__[ob.column] !== undefined ? b.__source__[ob.column] : null;
          let cmp = 0;
          if (aVal === null && bVal === null) cmp = 0;
          else if (aVal === null) cmp = 1;
          else if (bVal === null) cmp = -1;
          else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
          else cmp = String(aVal).localeCompare(String(bVal));
          if (cmp !== 0) return ob.direction === 'DESC' ? -cmp : cmp;
        }
        return 0;
      });
    }

    // Extract projected rows
    let finalRows = resultRows.map(r => r.__projected__);

    // DISTINCT
    if (ast.distinct) {
      const seen = new Set();
      const unique = [];
      for (const row of finalRows) {
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(row);
        }
      }
      finalRows = unique;
    }

    // OFFSET
    if (ast.offset) {
      finalRows = finalRows.slice(ast.offset);
    }

    // LIMIT
    if (ast.limit !== undefined && ast.limit !== null) {
      finalRows = finalRows.slice(0, ast.limit);
    }

    return finalRows;
  }

  _update(ast) {
    const table = this.tables[ast.table];
    if (!table) throw new Error(`Table ${ast.table} does not exist`);
    let count = 0;
    for (const row of table.rows) {
      const flatRow = { ...row };
      if (!ast.where || evaluateExpr(ast.where, flatRow, this)) {
        for (const { column, value } of ast.set) {
          const colDef = table.columns.find(c => c.name.toLowerCase() === column.toLowerCase());
          row[colDef ? colDef.name : column] = evaluateExpr(value, flatRow, this);
        }
        count++;
      }
    }
    return { success: true, message: `${count} row(s) updated`, affectedRows: count };
  }

  _delete(ast) {
    const table = this.tables[ast.table];
    if (!table) throw new Error(`Table ${ast.table} does not exist`);
    const before = table.rows.length;
    if (ast.where) {
      table.rows = table.rows.filter(row => !evaluateExpr(ast.where, row, this));
    } else {
      table.rows = [];
    }
    const count = before - table.rows.length;
    return { success: true, message: `${count} row(s) deleted`, affectedRows: count };
  }
}

// ============ EXPRESSION EVALUATOR ============

function evaluateExpr(expr, row, db) {
  if (!expr) return null;
  switch (expr.type) {
    case 'LITERAL': return expr.value;
    case 'COLUMN': {
      // Try prefixed first (table.column), then plain column
      if (expr.table) {
        const key = `${expr.table}.${expr.name}`;
        if (key in row) return row[key];
      }
      if (expr.name in row) return row[expr.name];
      // Try case-insensitive
      const lower = expr.name.toLowerCase();
      for (const k of Object.keys(row)) {
        if (k.toLowerCase() === lower) return row[k];
      }
      if (expr.table) {
        // Try looking in __tables__
        if (row.__tables__ && row.__tables__[expr.table]) {
          return row.__tables__[expr.table][expr.name] ?? null;
        }
      }
      return null;
    }
    case 'BINARY': {
      const left = evaluateExpr(expr.left, row, db);
      const right = evaluateExpr(expr.right, row, db);
      switch (expr.op) {
        case '=': return left == right ? true : false;
        case '!=': case '<>': return left != right ? true : false;
        case '<': return left < right ? true : false;
        case '>': return left > right ? true : false;
        case '<=': return left <= right ? true : false;
        case '>=': return left >= right ? true : false;
        case '+': return (left ?? 0) + (right ?? 0);
        case '-': return (left ?? 0) - (right ?? 0);
        case '*': return (left ?? 0) * (right ?? 0);
        case '/': return right === 0 ? null : (left ?? 0) / (right ?? 0);
        default: throw new Error(`Unknown operator: ${expr.op}`);
      }
    }
    case 'AND': return evaluateExpr(expr.left, row, db) && evaluateExpr(expr.right, row, db);
    case 'OR': return evaluateExpr(expr.left, row, db) || evaluateExpr(expr.right, row, db);
    case 'NOT': return !evaluateExpr(expr.operand, row, db);
    case 'LIKE': {
      const val = evaluateExpr(expr.value, row, db);
      if (val === null) return false;
      const pattern = evaluateExpr(expr.pattern, row, db);
      const regex = new RegExp('^' + String(pattern).replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
      return regex.test(String(val));
    }
    case 'IN': {
      const val = evaluateExpr(expr.value, row, db);
      if (expr.subquery) {
        const subResult = db._exec(expr.subquery);
        const vals = subResult.map(r => Object.values(r)[0]);
        return vals.includes(val);
      }
      const list = expr.list.map(e => evaluateExpr(e, row, db));
      return list.includes(val);
    }
    case 'NOT_IN': {
      const val = evaluateExpr(expr.value, row, db);
      if (expr.subquery) {
        const subResult = db._exec(expr.subquery);
        const vals = subResult.map(r => Object.values(r)[0]);
        return !vals.includes(val);
      }
      const list = expr.list.map(e => evaluateExpr(e, row, db));
      return !list.includes(val);
    }
    case 'BETWEEN': {
      const val = evaluateExpr(expr.value, row, db);
      const low = evaluateExpr(expr.low, row, db);
      const high = evaluateExpr(expr.high, row, db);
      return val >= low && val <= high;
    }
    case 'IS_NULL': {
      const val = evaluateExpr(expr.value, row, db);
      return val === null || val === undefined;
    }
    case 'IS_NOT_NULL': {
      const val = evaluateExpr(expr.value, row, db);
      return val !== null && val !== undefined;
    }
    case 'AGGREGATE': {
      const groupRows = row.__group__ || [row];
      const vals = groupRows.map(r => evaluateExpr(expr.arg, r, db)).filter(v => v !== null && v !== undefined);
      switch (expr.func) {
        case 'COUNT':
          if (expr.arg && expr.arg.type === 'LITERAL' && expr.arg.value === '*') return groupRows.length;
          return vals.length;
        case 'SUM': return vals.reduce((a, b) => a + b, 0);
        case 'AVG': return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        case 'MIN': return vals.length ? Math.min(...vals) : null;
        case 'MAX': return vals.length ? Math.max(...vals) : null;
        default: throw new Error(`Unknown aggregate: ${expr.func}`);
      }
    }
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}

function exprToName(expr) {
  if (!expr) return '?';
  switch (expr.type) {
    case 'COLUMN': return expr.table ? `${expr.table}.${expr.name}` : expr.name;
    case 'LITERAL': return String(expr.value);
    case 'AGGREGATE': {
      const argName = expr.arg ? exprToName(expr.arg) : '*';
      return `${expr.func}(${argName})`;
    }
    case 'BINARY': return `${exprToName(expr.left)} ${expr.op} ${exprToName(expr.right)}`;
    default: return '?';
  }
}

function castValue(val, type) {
  if (val === null) return null;
  switch (type) {
    case 'INT': return parseInt(val, 10);
    case 'FLOAT': return parseFloat(val);
    case 'TEXT': return String(val);
    default: return val;
  }
}

// ============ TOKENIZER ============

function tokenize(sql) {
  const tokens = [];
  let i = 0;
  const s = sql.trim();
  while (i < s.length) {
    // Skip whitespace
    if (/\s/.test(s[i])) { i++; continue; }
    // Skip single-line comments
    if (s[i] === '-' && s[i + 1] === '-') {
      while (i < s.length && s[i] !== '\n') i++;
      continue;
    }
    // Operators
    if (s[i] === '<' && s[i + 1] === '>') { tokens.push({ type: 'OP', value: '<>' }); i += 2; continue; }
    if (s[i] === '!' && s[i + 1] === '=') { tokens.push({ type: 'OP', value: '!=' }); i += 2; continue; }
    if (s[i] === '<' && s[i + 1] === '=') { tokens.push({ type: 'OP', value: '<=' }); i += 2; continue; }
    if (s[i] === '>' && s[i + 1] === '=') { tokens.push({ type: 'OP', value: '>=' }); i += 2; continue; }
    if ('<>=+-*/'.includes(s[i])) { tokens.push({ type: 'OP', value: s[i] }); i++; continue; }
    // Dot
    if (s[i] === '.') { tokens.push({ type: 'DOT', value: '.' }); i++; continue; }
    // Punctuation
    if ('(),;'.includes(s[i])) { tokens.push({ type: 'PUNCT', value: s[i] }); i++; continue; }
    // Star
    if (s[i] === '*') { tokens.push({ type: 'STAR', value: '*' }); i++; continue; }
    // String literal
    if (s[i] === "'") {
      let str = '';
      i++;
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") { str += "'"; i += 2; continue; }
        if (s[i] === "'") { i++; break; }
        str += s[i]; i++;
      }
      tokens.push({ type: 'STRING', value: str });
      continue;
    }
    // Number
    if (/[0-9]/.test(s[i]) || (s[i] === '.' && /[0-9]/.test(s[i + 1]))) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i]; i++; }
      tokens.push({ type: 'NUMBER', value: num.includes('.') ? parseFloat(num) : parseInt(num, 10) });
      continue;
    }
    // Identifier / keyword
    if (/[a-zA-Z_]/.test(s[i])) {
      let id = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { id += s[i]; i++; }
      const upper = id.toUpperCase();
      const keywords = ['SELECT','FROM','WHERE','INSERT','INTO','VALUES','CREATE','TABLE','DROP',
        'UPDATE','SET','DELETE','AND','OR','NOT','IN','BETWEEN','LIKE','IS','NULL','ORDER','BY',
        'ASC','DESC','LIMIT','OFFSET','GROUP','HAVING','AS','COUNT','AVG','SUM','MIN','MAX',
        'INNER','LEFT','RIGHT','JOIN','ON','DISTINCT','INT','FLOAT','TEXT','VARCHAR'];
      if (keywords.includes(upper)) {
        tokens.push({ type: 'KEYWORD', value: upper, original: id });
      } else {
        tokens.push({ type: 'IDENT', value: id });
      }
      continue;
    }
    throw new Error(`Unexpected character: ${s[i]} at position ${i}`);
  }
  return tokens;
}

// ============ PARSER ============

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos] || null; }
  advance() { return this.tokens[this.pos++]; }

  expect(type, value) {
    const t = this.advance();
    if (!t || t.type !== type || (value && t.value !== value)) {
      throw new Error(`Expected ${type} ${value || ''} but got ${t ? `${t.type} ${t.value}` : 'EOF'}`);
    }
    return t;
  }

  match(type, value) {
    const t = this.peek();
    if (t && t.type === type && (!value || t.value === value)) {
      this.advance();
      return t;
    }
    return null;
  }

  matchKeyword(kw) { return this.match('KEYWORD', kw); }

  parse() {
    const t = this.peek();
    if (!t) throw new Error('Empty query');
    if (t.value === 'SELECT') return this.parseSelect();
    if (t.value === 'CREATE') return this.parseCreate();
    if (t.value === 'DROP') return this.parseDrop();
    if (t.value === 'INSERT') return this.parseInsert();
    if (t.value === 'UPDATE') return this.parseUpdate();
    if (t.value === 'DELETE') return this.parseDelete();
    throw new Error(`Unexpected token: ${t.value}`);
  }

  parseCreate() {
    this.expect('KEYWORD', 'CREATE');
    this.expect('KEYWORD', 'TABLE');
    const name = this.advance().value;
    this.expect('PUNCT', '(');
    const columns = [];
    while (!this.match('PUNCT', ')')) {
      if (columns.length) this.expect('PUNCT', ',');
      const colName = this.advance().value;
      const colType = this.advance().value;
      columns.push({ name: colName, type: colType });
    }
    return { type: 'CREATE_TABLE', table: name, columns };
  }

  parseDrop() {
    this.expect('KEYWORD', 'DROP');
    this.expect('KEYWORD', 'TABLE');
    const name = this.advance().value;
    return { type: 'DROP_TABLE', table: name };
  }

  parseInsert() {
    this.expect('KEYWORD', 'INSERT');
    this.expect('KEYWORD', 'INTO');
    const table = this.advance().value;
    let columns = null;
    if (this.match('PUNCT', '(')) {
      columns = [];
      while (!this.match('PUNCT', ')')) {
        if (columns.length) this.expect('PUNCT', ',');
        columns.push(this.advance().value);
      }
    }
    this.expect('KEYWORD', 'VALUES');
    this.expect('PUNCT', '(');
    const values = [];
    while (!this.match('PUNCT', ')')) {
      if (values.length) this.expect('PUNCT', ',');
      values.push(this.parseValue());
    }
    return { type: 'INSERT', table, columns, values };
  }

  parseValue() {
    const t = this.peek();
    if (t.type === 'NUMBER') { this.advance(); return t.value; }
    if (t.type === 'STRING') { this.advance(); return t.value; }
    if (t.type === 'KEYWORD' && t.value === 'NULL') { this.advance(); return null; }
    // Negative number
    if (t.type === 'OP' && t.value === '-') {
      this.advance();
      const num = this.advance();
      return -num.value;
    }
    throw new Error(`Unexpected value token: ${t.type} ${t.value}`);
  }

  parseSelect() {
    this.expect('KEYWORD', 'SELECT');
    const distinct = !!this.matchKeyword('DISTINCT');
    const columns = this.parseSelectColumns();
    let from = null;
    if (this.matchKeyword('FROM')) {
      from = this.parseFrom();
    }
    // JOINs
    while (this.peek() && (
      (this.peek().value === 'JOIN') ||
      (this.peek().value === 'INNER') ||
      (this.peek().value === 'LEFT')
    )) {
      const joinType = this.peek().value === 'LEFT' ? 'LEFT' : 'INNER';
      if (this.peek().value !== 'JOIN') this.advance(); // skip INNER/LEFT
      this.expect('KEYWORD', 'JOIN');
      const rightTable = this.advance().value;
      let rightAlias = rightTable;
      if (this.peek() && this.peek().type === 'IDENT' && !['ON','WHERE','ORDER','GROUP','HAVING','LIMIT'].includes(this.peek().value.toUpperCase())) {
        rightAlias = this.advance().value;
      } else if (this.matchKeyword('AS')) {
        rightAlias = this.advance().value;
      }
      this.expect('KEYWORD', 'ON');
      const on = this.parseExpression();
      from = { type: 'JOIN', left: from, right: rightTable, rightAlias, joinType, on };
    }

    let where = null;
    if (this.matchKeyword('WHERE')) {
      where = this.parseExpression();
    }

    let groupBy = null;
    if (this.matchKeyword('GROUP')) {
      this.expect('KEYWORD', 'BY');
      groupBy = [];
      groupBy.push(this.parseExprAtom());
      while (this.match('PUNCT', ',')) {
        groupBy.push(this.parseExprAtom());
      }
    }

    let having = null;
    if (this.matchKeyword('HAVING')) {
      having = this.parseExpression();
    }

    let orderBy = null;
    if (this.matchKeyword('ORDER')) {
      this.expect('KEYWORD', 'BY');
      orderBy = [];
      do {
        const col = this.advance().value;
        let direction = 'ASC';
        if (this.matchKeyword('DESC')) direction = 'DESC';
        else this.matchKeyword('ASC');
        orderBy.push({ column: col, direction });
      } while (this.match('PUNCT', ','));
    }

    let limit = null;
    if (this.matchKeyword('LIMIT')) {
      limit = this.advance().value;
    }

    let offset = null;
    if (this.matchKeyword('OFFSET')) {
      offset = this.advance().value;
    }

    return { type: 'SELECT', columns, from, where, groupBy, having, orderBy, limit, offset, distinct };
  }

  parseFrom() {
    const table = this.advance().value;
    // Check for alias
    if (this.peek() && this.peek().type === 'IDENT' &&
        !['WHERE','ORDER','GROUP','HAVING','LIMIT','JOIN','INNER','LEFT','RIGHT','ON'].includes(this.peek().value.toUpperCase())) {
      const alias = this.advance().value;
      // Store alias (simplified: just use the alias as the table name reference)
      return table; // TODO: proper alias support for FROM
    }
    if (this.matchKeyword('AS')) {
      const alias = this.advance().value;
      return table;
    }
    return table;
  }

  parseSelectColumns() {
    const columns = [];
    do {
      if (this.peek() && (this.peek().type === 'STAR' || this.peek().value === '*')) {
        this.advance();
        columns.push({ star: true });
      } else {
        const expr = this.parseExpression();
        let alias = null;
        if (this.matchKeyword('AS')) {
          const aliasToken = this.advance();
          alias = aliasToken.original || aliasToken.value; // preserve original case for aliases
        } else if (this.peek() && (this.peek().type === 'IDENT' ||
                   (this.peek().type === 'KEYWORD' && !['FROM','WHERE','ORDER','GROUP','HAVING','LIMIT','JOIN','INNER','LEFT','RIGHT','ON','AND','OR','NOT','AS'].includes(this.peek().value))) &&
                   !['FROM','WHERE','ORDER','GROUP','HAVING','LIMIT','JOIN','INNER','LEFT','RIGHT'].includes((this.peek().value || '').toUpperCase())) {
          // Implicit alias
          alias = this.advance().value;
        }
        columns.push({ expr, alias });
      }
    } while (this.match('PUNCT', ','));
    return columns;
  }

  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.matchKeyword('OR')) {
      const right = this.parseAnd();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.matchKeyword('AND')) {
      const right = this.parseNot();
      left = { type: 'AND', left, right };
    }
    return left;
  }

  parseNot() {
    if (this.matchKeyword('NOT')) {
      return { type: 'NOT', operand: this.parseNot() };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAddSub();

    // IS NULL / IS NOT NULL
    if (this.matchKeyword('IS')) {
      if (this.matchKeyword('NOT')) {
        this.expect('KEYWORD', 'NULL');
        return { type: 'IS_NOT_NULL', value: left };
      }
      this.expect('KEYWORD', 'NULL');
      return { type: 'IS_NULL', value: left };
    }

    // NOT IN / NOT LIKE / NOT BETWEEN
    if (this.peek() && this.peek().value === 'NOT') {
      const saved = this.pos;
      this.advance();
      if (this.matchKeyword('IN')) {
        this.expect('PUNCT', '(');
        if (this.peek() && this.peek().value === 'SELECT') {
          const subquery = this.parseSelect();
          this.expect('PUNCT', ')');
          return { type: 'NOT_IN', value: left, subquery };
        }
        const list = this.parseExprList();
        this.expect('PUNCT', ')');
        return { type: 'NOT_IN', value: left, list };
      }
      if (this.matchKeyword('LIKE')) {
        const pattern = this.parseExprAtom();
        return { type: 'NOT', operand: { type: 'LIKE', value: left, pattern } };
      }
      if (this.matchKeyword('BETWEEN')) {
        const low = this.parseAddSub();
        this.expect('KEYWORD', 'AND');
        const high = this.parseAddSub();
        return { type: 'NOT', operand: { type: 'BETWEEN', value: left, low, high } };
      }
      this.pos = saved; // revert
    }

    // IN
    if (this.matchKeyword('IN')) {
      this.expect('PUNCT', '(');
      if (this.peek() && this.peek().value === 'SELECT') {
        const subquery = this.parseSelect();
        this.expect('PUNCT', ')');
        return { type: 'IN', value: left, subquery };
      }
      const list = this.parseExprList();
      this.expect('PUNCT', ')');
      return { type: 'IN', value: left, list };
    }

    // LIKE
    if (this.matchKeyword('LIKE')) {
      const pattern = this.parseExprAtom();
      return { type: 'LIKE', value: left, pattern };
    }

    // BETWEEN
    if (this.matchKeyword('BETWEEN')) {
      const low = this.parseAddSub();
      this.expect('KEYWORD', 'AND');
      const high = this.parseAddSub();
      return { type: 'BETWEEN', value: left, low, high };
    }

    // Comparison operators
    const t = this.peek();
    if (t && t.type === 'OP' && ['=', '!=', '<>', '<', '>', '<=', '>='].includes(t.value)) {
      this.advance();
      const right = this.parseAddSub();
      return { type: 'BINARY', op: t.value, left, right };
    }

    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.peek() && this.peek().type === 'OP' && ['+', '-'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseMulDiv();
      left = { type: 'BINARY', op, left, right };
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseExprAtom();
    while (this.peek() && ((this.peek().type === 'OP' && ['*', '/'].includes(this.peek().value)) ||
           (this.peek().type === 'STAR'))) {
      const op = this.advance().value;
      const right = this.parseExprAtom();
      left = { type: 'BINARY', op: op === '*' ? '*' : op, left, right };
    }
    return left;
  }

  parseExprAtom() {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of input');

    // Parenthesized expression
    if (t.type === 'PUNCT' && t.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      this.expect('PUNCT', ')');
      return expr;
    }

    // Aggregate functions
    if (t.type === 'KEYWORD' && ['COUNT', 'AVG', 'SUM', 'MIN', 'MAX'].includes(t.value)) {
      const func = this.advance().value;
      this.expect('PUNCT', '(');
      let arg;
      if (this.peek() && (this.peek().type === 'STAR' || this.peek().value === '*')) {
        this.advance();
        arg = { type: 'LITERAL', value: '*' };
      } else {
        arg = this.parseExpression();
      }
      this.expect('PUNCT', ')');
      return { type: 'AGGREGATE', func, arg };
    }

    // NULL
    if (t.type === 'KEYWORD' && t.value === 'NULL') {
      this.advance();
      return { type: 'LITERAL', value: null };
    }

    // Number
    if (t.type === 'NUMBER') {
      this.advance();
      return { type: 'LITERAL', value: t.value };
    }

    // String
    if (t.type === 'STRING') {
      this.advance();
      return { type: 'LITERAL', value: t.value };
    }

    // Negative number
    if (t.type === 'OP' && t.value === '-') {
      this.advance();
      const next = this.parseExprAtom();
      if (next.type === 'LITERAL') return { type: 'LITERAL', value: -next.value };
      return { type: 'BINARY', op: '*', left: { type: 'LITERAL', value: -1 }, right: next };
    }

    // Star (for SELECT *)
    if (t.type === 'STAR') {
      this.advance();
      return { type: 'LITERAL', value: '*' };
    }

    // Identifier (column or table.column)
    if (t.type === 'IDENT' || t.type === 'KEYWORD') {
      const name = this.advance().value;
      // Check for table.column (dot notation)
      if (this.peek() && this.peek().type === 'DOT') {
        this.advance(); // consume dot
        const colName = this.advance().value;
        return { type: 'COLUMN', name: colName, table: name };
      }
      return { type: 'COLUMN', name, table: null };
    }

    throw new Error(`Unexpected token: ${t.type} ${t.value}`);
  }

  parseExprList() {
    const list = [];
    list.push(this.parseExpression());
    while (this.match('PUNCT', ',')) {
      list.push(this.parseExpression());
    }
    return list;
  }

  parseUpdate() {
    this.expect('KEYWORD', 'UPDATE');
    const table = this.advance().value;
    this.expect('KEYWORD', 'SET');
    const set = [];
    do {
      const column = this.advance().value;
      this.expect('OP', '=');
      const value = this.parseExpression();
      set.push({ column, value });
    } while (this.match('PUNCT', ','));
    let where = null;
    if (this.matchKeyword('WHERE')) {
      where = this.parseExpression();
    }
    return { type: 'UPDATE', table, set, where };
  }

  parseDelete() {
    this.expect('KEYWORD', 'DELETE');
    this.expect('KEYWORD', 'FROM');
    const table = this.advance().value;
    let where = null;
    if (this.matchKeyword('WHERE')) {
      where = this.parseExpression();
    }
    return { type: 'DELETE', table, where };
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}

// ============ EXPORTS ============
module.exports = { Database, tokenize, parse };

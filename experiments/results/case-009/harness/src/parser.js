'use strict';

const { TokenType } = require('./lexer');
const AST = require('./ast');

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  advance() { return this.tokens[this.pos++]; }

  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} (${token.value}) at position ${token.position}`);
    }
    return this.advance();
  }

  match(...types) {
    if (types.includes(this.peek().type)) {
      return this.advance();
    }
    return null;
  }

  parse() {
    const statements = [];
    while (this.peek().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
      this.match(TokenType.SEMICOLON);
    }
    return statements;
  }

  parseStatement() {
    const token = this.peek();
    switch (token.type) {
      case TokenType.SELECT: return this.parseSelect();
      case TokenType.CREATE: return this.parseCreate();
      case TokenType.DROP: return this.parseDrop();
      case TokenType.INSERT: return this.parseInsert();
      case TokenType.UPDATE: return this.parseUpdate();
      case TokenType.DELETE: return this.parseDelete();
      default:
        throw new Error(`Unexpected token ${token.type} at position ${token.position}`);
    }
  }

  // ── SELECT ──────────────────────────────────────────────
  parseSelect() {
    this.expect(TokenType.SELECT);

    const distinct = !!this.match(TokenType.DISTINCT);
    const columns = this.parseSelectColumns();

    let from = null;
    if (this.match(TokenType.FROM)) {
      from = this.parseFrom();
    }

    const where = this.match(TokenType.WHERE) ? this.parseExpression() : null;

    let groupBy = null;
    if (this.match(TokenType.GROUP)) {
      this.expect(TokenType.BY);
      groupBy = this.parseExpressionList();
    }

    const having = this.match(TokenType.HAVING) ? this.parseExpression() : null;

    let orderBy = null;
    if (this.match(TokenType.ORDER)) {
      this.expect(TokenType.BY);
      orderBy = this.parseOrderByList();
    }

    let limit = null;
    if (this.match(TokenType.LIMIT)) {
      limit = this.expect(TokenType.NUMBER).value;
    }

    let offset = null;
    if (this.match(TokenType.OFFSET)) {
      offset = this.expect(TokenType.NUMBER).value;
    }

    return AST.SelectStatement({ distinct, columns, from, where, groupBy, having, orderBy, limit, offset });
  }

  parseSelectColumns() {
    if (this.peek().type === TokenType.STAR) {
      this.advance();
      return [AST.SelectColumn(AST.ColumnRef(null, '*'))];
    }

    const cols = [];
    do {
      cols.push(this.parseSelectColumn());
    } while (this.match(TokenType.COMMA));
    return cols;
  }

  parseSelectColumn() {
    const expr = this.parseExpression();
    let alias = null;
    if (this.match(TokenType.AS)) {
      alias = this.expect(TokenType.IDENTIFIER).value;
    } else if (this.peek().type === TokenType.IDENTIFIER &&
               this.peek().type !== TokenType.FROM &&
               !this.isKeyword(this.peek())) {
      alias = this.advance().value;
    }
    return AST.SelectColumn(expr, alias);
  }

  isKeyword(token) {
    const keywords = ['FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
      'JOIN', 'INNER', 'LEFT', 'ON', 'AND', 'OR', 'AS', 'IN', 'BETWEEN', 'LIKE',
      'IS', 'NOT', 'NULL', 'SET', 'INTO', 'VALUES'];
    return keywords.includes(token.type);
  }

  // ── FROM / JOIN ──────────────────────────────────────────
  parseFrom() {
    const table = this.parseTableRef();
    table.joins = [];

    while (this.peek().type === TokenType.JOIN ||
           this.peek().type === TokenType.INNER ||
           this.peek().type === TokenType.LEFT) {
      table.joins.push(this.parseJoin());
    }

    return table;
  }

  parseTableRef() {
    // Could be a subquery
    if (this.peek().type === TokenType.LPAREN) {
      this.advance();
      const subquery = this.parseSelect();
      this.expect(TokenType.RPAREN);
      let alias = null;
      if (this.match(TokenType.AS)) {
        alias = this.expect(TokenType.IDENTIFIER).value;
      } else if (this.peek().type === TokenType.IDENTIFIER && !this.isKeyword(this.peek())) {
        alias = this.advance().value;
      }
      return { type: 'SubqueryTable', query: subquery, alias };
    }

    const name = this.expect(TokenType.IDENTIFIER).value;
    let alias = null;
    if (this.match(TokenType.AS)) {
      alias = this.expect(TokenType.IDENTIFIER).value;
    } else if (this.peek().type === TokenType.IDENTIFIER && !this.isKeyword(this.peek())) {
      alias = this.advance().value;
    }
    return AST.TableRef(name, alias);
  }

  parseJoin() {
    let joinType = 'INNER';
    if (this.match(TokenType.LEFT)) {
      joinType = 'LEFT';
      this.match(TokenType.JOIN);  // optional JOIN keyword after LEFT
    } else if (this.match(TokenType.INNER)) {
      joinType = 'INNER';
      this.match(TokenType.JOIN);
    } else {
      this.expect(TokenType.JOIN);
    }

    const table = this.parseTableRef();
    this.expect(TokenType.ON);
    const on = this.parseExpression();

    return AST.JoinClause(joinType, table, on);
  }

  // ── ORDER BY ────────────────────────────────────────────
  parseOrderByList() {
    const items = [];
    do {
      const expr = this.parseExpression();
      let direction = 'ASC';
      if (this.match(TokenType.DESC)) {
        direction = 'DESC';
      } else {
        this.match(TokenType.ASC);
      }
      items.push(AST.OrderByItem(expr, direction));
    } while (this.match(TokenType.COMMA));
    return items;
  }

  // ── CREATE TABLE ────────────────────────────────────────
  parseCreate() {
    this.expect(TokenType.CREATE);
    this.expect(TokenType.TABLE);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LPAREN);

    const columns = [];
    do {
      columns.push(this.parseColumnDef());
    } while (this.match(TokenType.COMMA));

    this.expect(TokenType.RPAREN);
    return AST.CreateTableStatement({ name, columns });
  }

  parseColumnDef() {
    const name = this.expect(TokenType.IDENTIFIER).value;
    const typeToken = this.advance();
    const dataType = typeToken.value || typeToken.type;

    let primaryKey = false;
    if (this.peek().type === TokenType.PRIMARY) {
      this.advance();
      this.expect(TokenType.KEY);
      primaryKey = true;
    }

    return AST.ColumnDef(name, dataType, primaryKey);
  }

  // ── DROP TABLE ──────────────────────────────────────────
  parseDrop() {
    this.expect(TokenType.DROP);
    this.expect(TokenType.TABLE);
    const name = this.expect(TokenType.IDENTIFIER).value;
    return AST.DropTableStatement({ name });
  }

  // ── INSERT ──────────────────────────────────────────────
  parseInsert() {
    this.expect(TokenType.INSERT);
    this.expect(TokenType.INTO);
    const table = this.expect(TokenType.IDENTIFIER).value;

    let columns = null;
    if (this.peek().type === TokenType.LPAREN) {
      // Could be column list or VALUES
      // Check if the next token after LPAREN is a column name
      const savedPos = this.pos;
      this.advance(); // skip LPAREN
      if (this.peek().type === TokenType.IDENTIFIER) {
        // It's a column list
        this.pos = savedPos;
        columns = this.parseParenIdentifierList();
      } else {
        this.pos = savedPos;
      }
    }

    this.expect(TokenType.VALUES);

    const allValues = [];
    do {
      this.expect(TokenType.LPAREN);
      const values = this.parseExpressionList();
      this.expect(TokenType.RPAREN);
      allValues.push(values);
    } while (this.match(TokenType.COMMA));

    return AST.InsertStatement({ table, columns, values: allValues });
  }

  parseParenIdentifierList() {
    this.expect(TokenType.LPAREN);
    const list = [];
    do {
      list.push(this.expect(TokenType.IDENTIFIER).value);
    } while (this.match(TokenType.COMMA));
    this.expect(TokenType.RPAREN);
    return list;
  }

  // ── UPDATE ──────────────────────────────────────────────
  parseUpdate() {
    this.expect(TokenType.UPDATE);
    const table = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.SET);

    const assignments = [];
    do {
      const column = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.EQ);
      const value = this.parseExpression();
      assignments.push(AST.Assignment(column, value));
    } while (this.match(TokenType.COMMA));

    const where = this.match(TokenType.WHERE) ? this.parseExpression() : null;
    return AST.UpdateStatement({ table, assignments, where });
  }

  // ── DELETE ──────────────────────────────────────────────
  parseDelete() {
    this.expect(TokenType.DELETE);
    this.expect(TokenType.FROM);
    const table = this.expect(TokenType.IDENTIFIER).value;
    const where = this.match(TokenType.WHERE) ? this.parseExpression() : null;
    return AST.DeleteStatement({ table, where });
  }

  // ── Expression Parsing (Pratt-style precedence) ─────────
  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.match(TokenType.OR)) {
      left = AST.BinaryExpr('OR', left, this.parseAnd());
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.match(TokenType.AND)) {
      left = AST.BinaryExpr('AND', left, this.parseNot());
    }
    return left;
  }

  parseNot() {
    if (this.match(TokenType.NOT)) {
      return AST.UnaryExpr('NOT', this.parseNot());
    }
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAddSub();

    // IS [NOT] NULL
    if (this.peek().type === TokenType.IS) {
      this.advance();
      const negated = !!this.match(TokenType.NOT);
      this.expect(TokenType.NULL);
      return AST.IsNullExpr(left, negated);
    }

    // [NOT] IN (...)
    let negated = false;
    if (this.peek().type === TokenType.NOT) {
      const savedPos = this.pos;
      this.advance();
      if (this.peek().type === TokenType.IN || this.peek().type === TokenType.BETWEEN || this.peek().type === TokenType.LIKE) {
        negated = true;
      } else {
        this.pos = savedPos;
      }
    }

    if (this.match(TokenType.IN)) {
      this.expect(TokenType.LPAREN);
      // Could be subquery or value list
      if (this.peek().type === TokenType.SELECT) {
        const query = this.parseSelect();
        this.expect(TokenType.RPAREN);
        return AST.InExpr(left, AST.SubqueryExpr(query), negated);
      }
      const values = this.parseExpressionList();
      this.expect(TokenType.RPAREN);
      return AST.InExpr(left, values, negated);
    }

    // [NOT] BETWEEN ... AND ...
    if (this.match(TokenType.BETWEEN)) {
      const low = this.parseAddSub();
      this.expect(TokenType.AND);
      const high = this.parseAddSub();
      return AST.BetweenExpr(left, low, high, negated);
    }

    // [NOT] LIKE ...
    if (this.match(TokenType.LIKE)) {
      const pattern = this.expect(TokenType.STRING).value;
      return AST.LikeExpr(left, pattern, negated);
    }

    // Standard comparison operators
    const opMap = {
      [TokenType.EQ]: '=', [TokenType.NEQ]: '<>', [TokenType.LT]: '<',
      [TokenType.GT]: '>', [TokenType.LTE]: '<=', [TokenType.GTE]: '>='
    };

    const opToken = this.peek();
    if (opMap[opToken.type]) {
      this.advance();
      const right = this.parseAddSub();
      return AST.BinaryExpr(opMap[opToken.type], left, right);
    }

    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (true) {
      if (this.match(TokenType.PLUS)) {
        left = AST.BinaryExpr('+', left, this.parseMulDiv());
      } else if (this.match(TokenType.MINUS)) {
        left = AST.BinaryExpr('-', left, this.parseMulDiv());
      } else {
        break;
      }
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (true) {
      if (this.match(TokenType.STAR)) {
        left = AST.BinaryExpr('*', left, this.parseUnary());
      } else if (this.match(TokenType.SLASH)) {
        left = AST.BinaryExpr('/', left, this.parseUnary());
      } else if (this.match(TokenType.PERCENT)) {
        left = AST.BinaryExpr('%', left, this.parseUnary());
      } else {
        break;
      }
    }
    return left;
  }

  parseUnary() {
    if (this.match(TokenType.MINUS)) {
      return AST.UnaryExpr('-', this.parsePrimary());
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();

    // Number literal
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return AST.NumberLiteral(token.value);
    }

    // String literal
    if (token.type === TokenType.STRING) {
      this.advance();
      return AST.StringLiteral(token.value);
    }

    // NULL literal
    if (token.type === TokenType.NULL) {
      this.advance();
      return AST.NullLiteral();
    }

    // Parenthesized expression or subquery
    if (token.type === TokenType.LPAREN) {
      this.advance();
      if (this.peek().type === TokenType.SELECT) {
        const query = this.parseSelect();
        this.expect(TokenType.RPAREN);
        return AST.SubqueryExpr(query);
      }
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // Aggregate functions
    const aggFns = [TokenType.COUNT, TokenType.AVG, TokenType.SUM, TokenType.MIN, TokenType.MAX];
    if (aggFns.includes(token.type)) {
      this.advance();
      this.expect(TokenType.LPAREN);
      let arg;
      if (this.peek().type === TokenType.STAR) {
        this.advance();
        arg = '*';
      } else if (this.match(TokenType.DISTINCT)) {
        const inner = this.parseExpression();
        arg = { distinct: true, expr: inner };
      } else {
        arg = this.parseExpression();
      }
      this.expect(TokenType.RPAREN);
      return AST.AggregateExpr(token.type, arg);
    }

    // STAR (for SELECT *)
    if (token.type === TokenType.STAR) {
      this.advance();
      return AST.ColumnRef(null, '*');
    }

    // Identifier (possibly table.column)
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      if (this.match(TokenType.DOT)) {
        const col = this.peek();
        if (col.type === TokenType.STAR) {
          this.advance();
          return AST.ColumnRef(token.value, '*');
        }
        const colName = this.expect(TokenType.IDENTIFIER).value;
        return AST.ColumnRef(token.value, colName);
      }
      return AST.ColumnRef(null, token.value);
    }

    throw new Error(`Unexpected token ${token.type} (${token.value}) at position ${token.position}`);
  }

  parseExpressionList() {
    const list = [];
    do {
      list.push(this.parseExpression());
    } while (this.match(TokenType.COMMA));
    return list;
  }
}

module.exports = { Parser };

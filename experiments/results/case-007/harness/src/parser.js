// MiniLang Parser - Recursive descent with Pratt parsing for operator precedence
const { TokenType } = require('./token');
const { AST } = require('./ast');
const { ParseError } = require('./errors');

const PRECEDENCE = {
  LOWEST: 1,
  ASSIGN: 2,
  OR: 3,
  AND: 4,
  EQUALITY: 5,
  COMPARE: 6,
  SUM: 7,
  PRODUCT: 8,
  PREFIX: 9,
  CALL: 10,
  INDEX: 11,
};

const TOKEN_PRECEDENCE = {
  [TokenType.ASSIGN]: PRECEDENCE.ASSIGN,
  [TokenType.OR]: PRECEDENCE.OR,
  [TokenType.AND]: PRECEDENCE.AND,
  [TokenType.EQ]: PRECEDENCE.EQUALITY,
  [TokenType.NEQ]: PRECEDENCE.EQUALITY,
  [TokenType.LT]: PRECEDENCE.COMPARE,
  [TokenType.GT]: PRECEDENCE.COMPARE,
  [TokenType.LTE]: PRECEDENCE.COMPARE,
  [TokenType.GTE]: PRECEDENCE.COMPARE,
  [TokenType.PLUS]: PRECEDENCE.SUM,
  [TokenType.MINUS]: PRECEDENCE.SUM,
  [TokenType.STAR]: PRECEDENCE.PRODUCT,
  [TokenType.SLASH]: PRECEDENCE.PRODUCT,
  [TokenType.PERCENT]: PRECEDENCE.PRODUCT,
  [TokenType.LPAREN]: PRECEDENCE.CALL,
  [TokenType.LBRACKET]: PRECEDENCE.INDEX,
};

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  current() {
    return this.tokens[this.pos];
  }

  peek() {
    return this.tokens[this.pos];
  }

  peekType() {
    return this.current().type;
  }

  advance() {
    const tok = this.current();
    this.pos++;
    return tok;
  }

  expect(type) {
    const tok = this.current();
    if (tok.type !== type) {
      throw new ParseError(
        `Expected ${type}, got ${tok.type} (${JSON.stringify(tok.value)})`,
        tok.line, tok.column
      );
    }
    return this.advance();
  }

  match(type) {
    if (this.peekType() === type) {
      return this.advance();
    }
    return null;
  }

  currentPrecedence() {
    return TOKEN_PRECEDENCE[this.peekType()] || PRECEDENCE.LOWEST;
  }

  // --- Entry point ---
  parse() {
    const statements = [];
    while (this.peekType() !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }
    return AST.Program(statements);
  }

  // --- Statements ---
  parseStatement() {
    switch (this.peekType()) {
      case TokenType.LET: return this.parseLetStatement();
      case TokenType.RETURN: return this.parseReturnStatement();
      case TokenType.WHILE: return this.parseWhileStatement();
      case TokenType.FOR: return this.parseForStatement();
      case TokenType.LBRACE: return this.parseBlockStatement();
      default: return this.parseExpressionStatement();
    }
  }

  parseLetStatement() {
    const tok = this.expect(TokenType.LET);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.ASSIGN);
    const value = this.parseExpression(PRECEDENCE.LOWEST);
    this.match(TokenType.SEMICOLON);
    return AST.LetStatement(name, value, tok.line, tok.column);
  }

  parseReturnStatement() {
    const tok = this.expect(TokenType.RETURN);
    let value = null;
    if (this.peekType() !== TokenType.SEMICOLON && this.peekType() !== TokenType.RBRACE && this.peekType() !== TokenType.EOF) {
      value = this.parseExpression(PRECEDENCE.LOWEST);
    }
    this.match(TokenType.SEMICOLON);
    return AST.ReturnStatement(value, tok.line, tok.column);
  }

  parseWhileStatement() {
    const tok = this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression(PRECEDENCE.LOWEST);
    this.expect(TokenType.RPAREN);
    const body = this.parseBlockStatement();
    return AST.WhileStatement(condition, body, tok.line, tok.column);
  }

  parseForStatement() {
    const tok = this.expect(TokenType.FOR);
    this.expect(TokenType.LPAREN);

    // init
    let init = null;
    if (this.peekType() === TokenType.LET) {
      init = this.parseLetStatement();
    } else if (this.peekType() !== TokenType.SEMICOLON) {
      init = this.parseExpression(PRECEDENCE.LOWEST);
      this.match(TokenType.SEMICOLON);
    } else {
      this.advance(); // skip ;
    }

    // condition
    let condition = null;
    if (this.peekType() !== TokenType.SEMICOLON) {
      condition = this.parseExpression(PRECEDENCE.LOWEST);
    }
    this.expect(TokenType.SEMICOLON);

    // update
    let update = null;
    if (this.peekType() !== TokenType.RPAREN) {
      update = this.parseExpression(PRECEDENCE.LOWEST);
    }
    this.expect(TokenType.RPAREN);

    const body = this.parseBlockStatement();
    return AST.ForStatement(init, condition, update, body, tok.line, tok.column);
  }

  parseBlockStatement() {
    const tok = this.expect(TokenType.LBRACE);
    const statements = [];
    while (this.peekType() !== TokenType.RBRACE && this.peekType() !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE);
    return AST.BlockStatement(statements, tok.line, tok.column);
  }

  parseExpressionStatement() {
    const tok = this.current();
    const expr = this.parseExpression(PRECEDENCE.LOWEST);
    this.match(TokenType.SEMICOLON);
    return AST.ExpressionStatement(expr, tok.line, tok.column);
  }

  // --- Pratt Parser for expressions ---
  parseExpression(precedence) {
    let left = this.parsePrefix();

    while (precedence < this.currentPrecedence()) {
      left = this.parseInfix(left);
    }

    return left;
  }

  parsePrefix() {
    const tok = this.current();
    switch (tok.type) {
      case TokenType.NUMBER: {
        this.advance();
        return AST.NumberLiteral(tok.value, tok.line, tok.column);
      }
      case TokenType.STRING: {
        this.advance();
        return AST.StringLiteral(tok.value, tok.line, tok.column);
      }
      case TokenType.TRUE: {
        this.advance();
        return AST.BoolLiteral(true, tok.line, tok.column);
      }
      case TokenType.FALSE: {
        this.advance();
        return AST.BoolLiteral(false, tok.line, tok.column);
      }
      case TokenType.NULL: {
        this.advance();
        return AST.NullLiteral(tok.line, tok.column);
      }
      case TokenType.IDENTIFIER: {
        this.advance();
        return AST.Identifier(tok.value, tok.line, tok.column);
      }
      case TokenType.MINUS:
      case TokenType.NOT: {
        this.advance();
        const operand = this.parseExpression(PRECEDENCE.PREFIX);
        return AST.UnaryExpr(tok.value, operand, tok.line, tok.column);
      }
      case TokenType.LPAREN: {
        this.advance();
        const expr = this.parseExpression(PRECEDENCE.LOWEST);
        this.expect(TokenType.RPAREN);
        return expr;
      }
      case TokenType.LBRACKET: {
        return this.parseArrayLiteral();
      }
      case TokenType.IF: {
        return this.parseIfExpression();
      }
      case TokenType.FN: {
        return this.parseFunctionLiteral();
      }
      default:
        throw new ParseError(
          `Unexpected token: ${tok.type} (${JSON.stringify(tok.value)})`,
          tok.line, tok.column
        );
    }
  }

  parseInfix(left) {
    const tok = this.current();
    switch (tok.type) {
      case TokenType.PLUS:
      case TokenType.MINUS:
      case TokenType.STAR:
      case TokenType.SLASH:
      case TokenType.PERCENT:
      case TokenType.EQ:
      case TokenType.NEQ:
      case TokenType.LT:
      case TokenType.GT:
      case TokenType.LTE:
      case TokenType.GTE:
      case TokenType.AND:
      case TokenType.OR: {
        const prec = this.currentPrecedence();
        this.advance();
        const right = this.parseExpression(prec);
        return AST.BinaryExpr(tok.value, left, right, tok.line, tok.column);
      }
      case TokenType.ASSIGN: {
        this.advance();
        const value = this.parseExpression(PRECEDENCE.LOWEST);
        return AST.AssignExpr(left, value, tok.line, tok.column);
      }
      case TokenType.LPAREN: {
        return this.parseCallExpression(left);
      }
      case TokenType.LBRACKET: {
        return this.parseIndexExpression(left);
      }
      default:
        throw new ParseError(
          `Unexpected infix token: ${tok.type}`,
          tok.line, tok.column
        );
    }
  }

  parseArrayLiteral() {
    const tok = this.expect(TokenType.LBRACKET);
    const elements = [];
    if (this.peekType() !== TokenType.RBRACKET) {
      elements.push(this.parseExpression(PRECEDENCE.LOWEST));
      while (this.match(TokenType.COMMA)) {
        if (this.peekType() === TokenType.RBRACKET) break;
        elements.push(this.parseExpression(PRECEDENCE.LOWEST));
      }
    }
    this.expect(TokenType.RBRACKET);
    return AST.ArrayLiteral(elements, tok.line, tok.column);
  }

  parseIfExpression() {
    const tok = this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression(PRECEDENCE.LOWEST);
    this.expect(TokenType.RPAREN);
    const consequence = this.parseBlockStatement();
    let alternative = null;
    if (this.match(TokenType.ELSE)) {
      if (this.peekType() === TokenType.IF) {
        // else if chain
        const elseIf = this.parseIfExpression();
        alternative = AST.BlockStatement(
          [AST.ExpressionStatement(elseIf, elseIf.line, elseIf.column)],
          elseIf.line, elseIf.column
        );
      } else {
        alternative = this.parseBlockStatement();
      }
    }
    return AST.IfExpr(condition, consequence, alternative, tok.line, tok.column);
  }

  parseFunctionLiteral() {
    const tok = this.expect(TokenType.FN);
    // Optional name
    let name = null;
    if (this.peekType() === TokenType.IDENTIFIER) {
      name = this.advance().value;
    }
    this.expect(TokenType.LPAREN);
    const params = [];
    if (this.peekType() !== TokenType.RPAREN) {
      params.push(this.expect(TokenType.IDENTIFIER).value);
      while (this.match(TokenType.COMMA)) {
        params.push(this.expect(TokenType.IDENTIFIER).value);
      }
    }
    this.expect(TokenType.RPAREN);
    const body = this.parseBlockStatement();
    return AST.FunctionLiteral(params, body, name, tok.line, tok.column);
  }

  parseCallExpression(callee) {
    const tok = this.expect(TokenType.LPAREN);
    const args = [];
    if (this.peekType() !== TokenType.RPAREN) {
      args.push(this.parseExpression(PRECEDENCE.LOWEST));
      while (this.match(TokenType.COMMA)) {
        args.push(this.parseExpression(PRECEDENCE.LOWEST));
      }
    }
    this.expect(TokenType.RPAREN);
    return AST.CallExpr(callee, args, tok.line, tok.column);
  }

  parseIndexExpression(object) {
    const tok = this.expect(TokenType.LBRACKET);
    const index = this.parseExpression(PRECEDENCE.LOWEST);
    this.expect(TokenType.RBRACKET);
    return AST.IndexExpr(object, index, tok.line, tok.column);
  }
}

module.exports = { Parser, PRECEDENCE };

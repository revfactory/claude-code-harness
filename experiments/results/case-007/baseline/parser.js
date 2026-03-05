'use strict';

const { TokenType } = require('./lexer');

class ParseError extends Error {
  constructor(message, token) {
    const loc = token ? ` at ${token.line}:${token.col}` : '';
    super(`Parse error${loc}: ${message}`);
    this.token = token;
  }
}

// AST Node types
const NodeType = {
  Program: 'Program',
  LetDeclaration: 'LetDeclaration',
  Assignment: 'Assignment',
  IndexAssignment: 'IndexAssignment',
  BinaryExpr: 'BinaryExpr',
  UnaryExpr: 'UnaryExpr',
  NumberLiteral: 'NumberLiteral',
  StringLiteral: 'StringLiteral',
  BooleanLiteral: 'BooleanLiteral',
  NullLiteral: 'NullLiteral',
  ArrayLiteral: 'ArrayLiteral',
  Identifier: 'Identifier',
  FunctionDecl: 'FunctionDecl',
  FunctionExpr: 'FunctionExpr',
  CallExpr: 'CallExpr',
  IndexExpr: 'IndexExpr',
  ReturnStmt: 'ReturnStmt',
  IfStmt: 'IfStmt',
  WhileStmt: 'WhileStmt',
  ForStmt: 'ForStmt',
  Block: 'Block',
  ExpressionStmt: 'ExpressionStmt',
};

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  advance() {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      throw new ParseError(`Expected ${type}, got ${token.type} (${JSON.stringify(token.value)})`, token);
    }
    return this.advance();
  }

  match(type) {
    if (this.peek().type === type) {
      return this.advance();
    }
    return null;
  }

  parse() {
    const statements = [];
    while (this.peek().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }
    return { type: NodeType.Program, body: statements };
  }

  parseStatement() {
    const token = this.peek();

    switch (token.type) {
      case TokenType.LET: return this.parseLetDeclaration();
      case TokenType.FN: return this.parseFunctionDeclOrExprStmt();
      case TokenType.RETURN: return this.parseReturn();
      case TokenType.IF: return this.parseIf();
      case TokenType.WHILE: return this.parseWhile();
      case TokenType.FOR: return this.parseFor();
      case TokenType.LBRACE: return this.parseBlock();
      default: return this.parseExpressionStatement();
    }
  }

  parseLetDeclaration() {
    const token = this.advance(); // consume 'let'
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.ASSIGN);
    const init = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return { type: NodeType.LetDeclaration, name, init, line: token.line, col: token.col };
  }

  parseFunctionDeclOrExprStmt() {
    // Look ahead: fn IDENTIFIER( => declaration, fn( => expression
    if (this.pos + 1 < this.tokens.length && this.tokens[this.pos + 1].type === TokenType.IDENTIFIER) {
      // Check if after identifier there's a '('
      if (this.pos + 2 < this.tokens.length && this.tokens[this.pos + 2].type === TokenType.LPAREN) {
        return this.parseFunctionDeclaration();
      }
    }
    return this.parseExpressionStatement();
  }

  parseFunctionDeclaration() {
    const token = this.advance(); // consume 'fn'
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LPAREN);
    const params = this.parseParamList();
    this.expect(TokenType.RPAREN);
    const body = this.parseBlock();
    return { type: NodeType.FunctionDecl, name, params, body, line: token.line, col: token.col };
  }

  parseFunctionExpr() {
    const token = this.advance(); // consume 'fn'
    this.expect(TokenType.LPAREN);
    const params = this.parseParamList();
    this.expect(TokenType.RPAREN);
    const body = this.parseBlock();
    return { type: NodeType.FunctionExpr, params, body, line: token.line, col: token.col };
  }

  parseParamList() {
    const params = [];
    if (this.peek().type !== TokenType.RPAREN) {
      params.push(this.expect(TokenType.IDENTIFIER).value);
      while (this.match(TokenType.COMMA)) {
        params.push(this.expect(TokenType.IDENTIFIER).value);
      }
    }
    return params;
  }

  parseReturn() {
    const token = this.advance(); // consume 'return'
    let value = null;
    if (this.peek().type !== TokenType.SEMICOLON) {
      value = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON);
    return { type: NodeType.ReturnStmt, value, line: token.line, col: token.col };
  }

  parseIf() {
    const token = this.advance(); // consume 'if'
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const consequent = this.parseBlock();
    let alternate = null;
    if (this.match(TokenType.ELSE)) {
      if (this.peek().type === TokenType.IF) {
        alternate = this.parseIf();
      } else {
        alternate = this.parseBlock();
      }
    }
    return { type: NodeType.IfStmt, condition, consequent, alternate, line: token.line, col: token.col };
  }

  parseWhile() {
    const token = this.advance(); // consume 'while'
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const body = this.parseBlock();
    return { type: NodeType.WhileStmt, condition, body, line: token.line, col: token.col };
  }

  parseFor() {
    const token = this.advance(); // consume 'for'
    this.expect(TokenType.LPAREN);
    // init
    let init = null;
    if (this.peek().type === TokenType.LET) {
      init = this.parseLetDeclaration();
    } else if (this.peek().type !== TokenType.SEMICOLON) {
      init = this.parseExpressionStatement();
    } else {
      this.advance(); // consume ';'
    }
    // condition
    let condition = null;
    if (this.peek().type !== TokenType.SEMICOLON) {
      condition = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON);
    // update
    let update = null;
    if (this.peek().type !== TokenType.RPAREN) {
      update = this.parseExpression();
      // Check if it's an assignment (we need to wrap it or handle it)
    }
    this.expect(TokenType.RPAREN);
    const body = this.parseBlock();
    return { type: NodeType.ForStmt, init, condition, update, body, line: token.line, col: token.col };
  }

  parseBlock() {
    this.expect(TokenType.LBRACE);
    const statements = [];
    while (this.peek().type !== TokenType.RBRACE) {
      statements.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE);
    return { type: NodeType.Block, body: statements };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return { type: NodeType.ExpressionStmt, expression: expr };
  }

  // Expression parsing with precedence climbing
  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseOr();

    if (this.peek().type === TokenType.ASSIGN) {
      this.advance();
      const right = this.parseAssignment();
      if (left.type === NodeType.Identifier) {
        return { type: NodeType.Assignment, name: left.name, value: right, line: left.line, col: left.col };
      } else if (left.type === NodeType.IndexExpr) {
        return { type: NodeType.IndexAssignment, object: left.object, index: left.index, value: right, line: left.line, col: left.col };
      }
      throw new ParseError('Invalid assignment target', this.peek());
    }
    return left;
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.peek().type === TokenType.OR) {
      const op = this.advance();
      const right = this.parseAnd();
      left = { type: NodeType.BinaryExpr, op: '||', left, right, line: op.line, col: op.col };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseEquality();
    while (this.peek().type === TokenType.AND) {
      const op = this.advance();
      const right = this.parseEquality();
      left = { type: NodeType.BinaryExpr, op: '&&', left, right, line: op.line, col: op.col };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.EQ || this.peek().type === TokenType.NEQ) {
      const op = this.advance();
      const right = this.parseComparison();
      left = { type: NodeType.BinaryExpr, op: op.value, left, right, line: op.line, col: op.col };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAddition();
    while ([TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE].includes(this.peek().type)) {
      const op = this.advance();
      const right = this.parseAddition();
      left = { type: NodeType.BinaryExpr, op: op.value, left, right, line: op.line, col: op.col };
    }
    return left;
  }

  parseAddition() {
    let left = this.parseMultiplication();
    while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS) {
      const op = this.advance();
      const right = this.parseMultiplication();
      left = { type: NodeType.BinaryExpr, op: op.value, left, right, line: op.line, col: op.col };
    }
    return left;
  }

  parseMultiplication() {
    let left = this.parseUnary();
    while ([TokenType.STAR, TokenType.SLASH, TokenType.PERCENT].includes(this.peek().type)) {
      const op = this.advance();
      const right = this.parseUnary();
      left = { type: NodeType.BinaryExpr, op: op.value, left, right, line: op.line, col: op.col };
    }
    return left;
  }

  parseUnary() {
    if (this.peek().type === TokenType.NOT) {
      const op = this.advance();
      const operand = this.parseUnary();
      return { type: NodeType.UnaryExpr, op: '!', operand, line: op.line, col: op.col };
    }
    if (this.peek().type === TokenType.MINUS) {
      const op = this.advance();
      const operand = this.parseUnary();
      return { type: NodeType.UnaryExpr, op: '-', operand, line: op.line, col: op.col };
    }
    return this.parseCallAndIndex();
  }

  parseCallAndIndex() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek().type === TokenType.LPAREN) {
        this.advance();
        const args = [];
        if (this.peek().type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) {
            args.push(this.parseExpression());
          }
        }
        this.expect(TokenType.RPAREN);
        expr = { type: NodeType.CallExpr, callee: expr, args, line: expr.line, col: expr.col };
      } else if (this.peek().type === TokenType.LBRACKET) {
        this.advance();
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        expr = { type: NodeType.IndexExpr, object: expr, index, line: expr.line, col: expr.col };
      } else {
        break;
      }
    }
    return expr;
  }

  parsePrimary() {
    const token = this.peek();

    switch (token.type) {
      case TokenType.NUMBER:
        this.advance();
        return { type: NodeType.NumberLiteral, value: token.value, line: token.line, col: token.col };

      case TokenType.STRING:
        this.advance();
        return { type: NodeType.StringLiteral, value: token.value, line: token.line, col: token.col };

      case TokenType.BOOLEAN:
        this.advance();
        return { type: NodeType.BooleanLiteral, value: token.value, line: token.line, col: token.col };

      case TokenType.NULL:
        this.advance();
        return { type: NodeType.NullLiteral, value: null, line: token.line, col: token.col };

      case TokenType.IDENTIFIER:
        this.advance();
        return { type: NodeType.Identifier, name: token.value, line: token.line, col: token.col };

      case TokenType.FN:
        return this.parseFunctionExpr();

      case TokenType.LPAREN:
        this.advance();
        const expr = this.parseExpression();
        this.expect(TokenType.RPAREN);
        return expr;

      case TokenType.LBRACKET:
        return this.parseArrayLiteral();

      default:
        throw new ParseError(`Unexpected token ${token.type} (${JSON.stringify(token.value)})`, token);
    }
  }

  parseArrayLiteral() {
    const token = this.advance(); // consume '['
    const elements = [];
    if (this.peek().type !== TokenType.RBRACKET) {
      elements.push(this.parseExpression());
      while (this.match(TokenType.COMMA)) {
        elements.push(this.parseExpression());
      }
    }
    this.expect(TokenType.RBRACKET);
    return { type: NodeType.ArrayLiteral, elements, line: token.line, col: token.col };
  }
}

module.exports = { Parser, ParseError, NodeType };

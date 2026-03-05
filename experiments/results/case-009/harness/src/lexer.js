'use strict';

const TokenType = {
  // Keywords
  SELECT: 'SELECT', FROM: 'FROM', WHERE: 'WHERE',
  INSERT: 'INSERT', INTO: 'INTO', VALUES: 'VALUES',
  CREATE: 'CREATE', TABLE: 'TABLE', DROP: 'DROP',
  UPDATE: 'UPDATE', SET: 'SET', DELETE: 'DELETE',
  ORDER: 'ORDER', BY: 'BY', ASC: 'ASC', DESC: 'DESC',
  LIMIT: 'LIMIT', OFFSET: 'OFFSET',
  GROUP: 'GROUP', HAVING: 'HAVING',
  JOIN: 'JOIN', INNER: 'INNER', LEFT: 'LEFT', ON: 'ON',
  AS: 'AS', DISTINCT: 'DISTINCT',
  AND: 'AND', OR: 'OR', NOT: 'NOT',
  IN: 'IN', BETWEEN: 'BETWEEN', LIKE: 'LIKE',
  IS: 'IS', NULL: 'NULL',
  COUNT: 'COUNT', AVG: 'AVG', SUM: 'SUM', MIN: 'MIN', MAX: 'MAX',
  INT: 'INT', FLOAT: 'FLOAT', TEXT: 'TEXT',
  PRIMARY: 'PRIMARY', KEY: 'KEY',
  // Operators
  EQ: 'EQ', NEQ: 'NEQ', LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE',
  STAR: 'STAR', PLUS: 'PLUS', MINUS: 'MINUS', SLASH: 'SLASH', PERCENT: 'PERCENT',
  // Delimiters
  LPAREN: 'LPAREN', RPAREN: 'RPAREN', COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON', DOT: 'DOT',
  // Literals
  NUMBER: 'NUMBER', STRING: 'STRING', IDENTIFIER: 'IDENTIFIER',
  EOF: 'EOF'
};

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES',
  'CREATE', 'TABLE', 'DROP', 'UPDATE', 'SET', 'DELETE',
  'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'GROUP', 'HAVING', 'JOIN', 'INNER', 'LEFT', 'ON',
  'AS', 'DISTINCT', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN',
  'LIKE', 'IS', 'NULL', 'COUNT', 'AVG', 'SUM', 'MIN', 'MAX',
  'INT', 'FLOAT', 'TEXT', 'PRIMARY', 'KEY'
]);

class Token {
  constructor(type, value, position) {
    this.type = type;
    this.value = value;
    this.position = position;
  }
}

class Lexer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.tokens = [];
  }

  tokenize() {
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const ch = this.input[this.pos];

      if (ch === '-' && this.input[this.pos + 1] === '-') {
        this.skipLineComment();
        continue;
      }

      if (ch === '/' && this.input[this.pos + 1] === '*') {
        this.skipBlockComment();
        continue;
      }

      if (this.isDigit(ch)) {
        this.readNumber();
      } else if (ch === "'") {
        this.readString();
      } else if (this.isAlpha(ch) || ch === '_') {
        this.readIdentifierOrKeyword();
      } else {
        this.readOperatorOrDelimiter();
      }
    }

    this.tokens.push(new Token(TokenType.EOF, null, this.pos));
    return this.tokens;
  }

  skipWhitespace() {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  skipLineComment() {
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      this.pos++;
    }
  }

  skipBlockComment() {
    this.pos += 2;
    while (this.pos < this.input.length - 1) {
      if (this.input[this.pos] === '*' && this.input[this.pos + 1] === '/') {
        this.pos += 2;
        return;
      }
      this.pos++;
    }
    throw new Error('Unterminated block comment');
  }

  isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  isAlpha(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  isAlphaNumeric(ch) {
    return this.isAlpha(ch) || this.isDigit(ch) || ch === '_';
  }

  readNumber() {
    const start = this.pos;
    let hasDot = false;
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === '.' && !hasDot) {
        hasDot = true;
        this.pos++;
      } else if (this.isDigit(ch)) {
        this.pos++;
      } else {
        break;
      }
    }
    const value = this.input.slice(start, this.pos);
    this.tokens.push(new Token(TokenType.NUMBER, hasDot ? parseFloat(value) : parseInt(value, 10), start));
  }

  readString() {
    const start = this.pos;
    this.pos++; // skip opening quote
    let value = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === "'" && this.input[this.pos + 1] === "'") {
        value += "'";
        this.pos += 2;
      } else if (this.input[this.pos] === "'") {
        this.pos++;
        this.tokens.push(new Token(TokenType.STRING, value, start));
        return;
      } else {
        value += this.input[this.pos];
        this.pos++;
      }
    }
    throw new Error(`Unterminated string at position ${start}`);
  }

  readIdentifierOrKeyword() {
    const start = this.pos;
    while (this.pos < this.input.length && this.isAlphaNumeric(this.input[this.pos])) {
      this.pos++;
    }
    const word = this.input.slice(start, this.pos);
    const upper = word.toUpperCase();
    if (KEYWORDS.has(upper)) {
      this.tokens.push(new Token(TokenType[upper], upper, start));
    } else {
      this.tokens.push(new Token(TokenType.IDENTIFIER, word, start));
    }
  }

  readOperatorOrDelimiter() {
    const start = this.pos;
    const ch = this.input[this.pos];
    const next = this.input[this.pos + 1];

    switch (ch) {
      case '(': this.tokens.push(new Token(TokenType.LPAREN, '(', start)); this.pos++; break;
      case ')': this.tokens.push(new Token(TokenType.RPAREN, ')', start)); this.pos++; break;
      case ',': this.tokens.push(new Token(TokenType.COMMA, ',', start)); this.pos++; break;
      case ';': this.tokens.push(new Token(TokenType.SEMICOLON, ';', start)); this.pos++; break;
      case '.': this.tokens.push(new Token(TokenType.DOT, '.', start)); this.pos++; break;
      case '*': this.tokens.push(new Token(TokenType.STAR, '*', start)); this.pos++; break;
      case '+': this.tokens.push(new Token(TokenType.PLUS, '+', start)); this.pos++; break;
      case '-': this.tokens.push(new Token(TokenType.MINUS, '-', start)); this.pos++; break;
      case '/': this.tokens.push(new Token(TokenType.SLASH, '/', start)); this.pos++; break;
      case '%': this.tokens.push(new Token(TokenType.PERCENT, '%', start)); this.pos++; break;
      case '=': this.tokens.push(new Token(TokenType.EQ, '=', start)); this.pos++; break;
      case '<':
        if (next === '=') { this.tokens.push(new Token(TokenType.LTE, '<=', start)); this.pos += 2; }
        else if (next === '>') { this.tokens.push(new Token(TokenType.NEQ, '<>', start)); this.pos += 2; }
        else { this.tokens.push(new Token(TokenType.LT, '<', start)); this.pos++; }
        break;
      case '>':
        if (next === '=') { this.tokens.push(new Token(TokenType.GTE, '>=', start)); this.pos += 2; }
        else { this.tokens.push(new Token(TokenType.GT, '>', start)); this.pos++; }
        break;
      case '!':
        if (next === '=') { this.tokens.push(new Token(TokenType.NEQ, '!=', start)); this.pos += 2; }
        else { throw new Error(`Unexpected character '!' at position ${start}`); }
        break;
      default:
        throw new Error(`Unexpected character '${ch}' at position ${start}`);
    }
  }
}

module.exports = { Lexer, Token, TokenType, KEYWORDS };

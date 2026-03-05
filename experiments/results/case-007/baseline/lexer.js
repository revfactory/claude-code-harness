'use strict';

const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  IDENTIFIER: 'IDENTIFIER',

  // Keywords
  LET: 'LET',
  FN: 'FN',
  RETURN: 'RETURN',
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  FOR: 'FOR',

  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  ASSIGN: 'ASSIGN',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',

  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON',

  EOF: 'EOF',
};

class Token {
  constructor(type, value, line, col) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.col = col;
  }
}

class LexerError extends Error {
  constructor(message, line, col) {
    super(`Lexer error at ${line}:${col}: ${message}`);
    this.line = line;
    this.col = col;
  }
}

class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.tokens = [];
  }

  peek() {
    return this.pos < this.source.length ? this.source[this.pos] : null;
  }

  advance() {
    const ch = this.source[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return ch;
  }

  match(expected) {
    if (this.pos < this.source.length && this.source[this.pos] === expected) {
      this.advance();
      return true;
    }
    return false;
  }

  skipWhitespace() {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advance();
      } else if (ch === '/' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '/') {
        // Line comment
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  readString(quote) {
    const startLine = this.line;
    const startCol = this.col;
    let str = '';
    while (this.pos < this.source.length) {
      const ch = this.advance();
      if (ch === quote) {
        return new Token(TokenType.STRING, str, startLine, startCol);
      }
      if (ch === '\\') {
        const next = this.advance();
        switch (next) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case '\\': str += '\\'; break;
          case '"': str += '"'; break;
          case "'": str += "'"; break;
          default: str += next;
        }
      } else {
        str += ch;
      }
    }
    throw new LexerError('Unterminated string', startLine, startCol);
  }

  readNumber() {
    const startLine = this.line;
    const startCol = this.col;
    let num = '';
    let isFloat = false;
    while (this.pos < this.source.length && /[0-9]/.test(this.source[this.pos])) {
      num += this.advance();
    }
    if (this.pos < this.source.length && this.source[this.pos] === '.' &&
        this.pos + 1 < this.source.length && /[0-9]/.test(this.source[this.pos + 1])) {
      isFloat = true;
      num += this.advance(); // '.'
      while (this.pos < this.source.length && /[0-9]/.test(this.source[this.pos])) {
        num += this.advance();
      }
    }
    return new Token(TokenType.NUMBER, isFloat ? parseFloat(num) : parseInt(num, 10), startLine, startCol);
  }

  readIdentifier() {
    const startLine = this.line;
    const startCol = this.col;
    let id = '';
    while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.pos])) {
      id += this.advance();
    }
    const keywords = {
      'let': TokenType.LET,
      'fn': TokenType.FN,
      'return': TokenType.RETURN,
      'if': TokenType.IF,
      'else': TokenType.ELSE,
      'while': TokenType.WHILE,
      'for': TokenType.FOR,
      'true': TokenType.BOOLEAN,
      'false': TokenType.BOOLEAN,
      'null': TokenType.NULL,
    };
    if (keywords[id]) {
      let value = id;
      if (id === 'true') value = true;
      else if (id === 'false') value = false;
      else if (id === 'null') value = null;
      return new Token(keywords[id], value, startLine, startCol);
    }
    return new Token(TokenType.IDENTIFIER, id, startLine, startCol);
  }

  tokenize() {
    while (true) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) {
        this.tokens.push(new Token(TokenType.EOF, null, this.line, this.col));
        break;
      }

      const startLine = this.line;
      const startCol = this.col;
      const ch = this.source[this.pos];

      if (/[0-9]/.test(ch)) {
        this.tokens.push(this.readNumber());
      } else if (/[a-zA-Z_]/.test(ch)) {
        this.tokens.push(this.readIdentifier());
      } else if (ch === '"' || ch === "'") {
        this.advance();
        this.tokens.push(this.readString(ch));
      } else {
        this.advance();
        switch (ch) {
          case '+': this.tokens.push(new Token(TokenType.PLUS, '+', startLine, startCol)); break;
          case '-': this.tokens.push(new Token(TokenType.MINUS, '-', startLine, startCol)); break;
          case '*': this.tokens.push(new Token(TokenType.STAR, '*', startLine, startCol)); break;
          case '/': this.tokens.push(new Token(TokenType.SLASH, '/', startLine, startCol)); break;
          case '%': this.tokens.push(new Token(TokenType.PERCENT, '%', startLine, startCol)); break;
          case '(': this.tokens.push(new Token(TokenType.LPAREN, '(', startLine, startCol)); break;
          case ')': this.tokens.push(new Token(TokenType.RPAREN, ')', startLine, startCol)); break;
          case '{': this.tokens.push(new Token(TokenType.LBRACE, '{', startLine, startCol)); break;
          case '}': this.tokens.push(new Token(TokenType.RBRACE, '}', startLine, startCol)); break;
          case '[': this.tokens.push(new Token(TokenType.LBRACKET, '[', startLine, startCol)); break;
          case ']': this.tokens.push(new Token(TokenType.RBRACKET, ']', startLine, startCol)); break;
          case ',': this.tokens.push(new Token(TokenType.COMMA, ',', startLine, startCol)); break;
          case ';': this.tokens.push(new Token(TokenType.SEMICOLON, ';', startLine, startCol)); break;
          case '=':
            if (this.match('=')) this.tokens.push(new Token(TokenType.EQ, '==', startLine, startCol));
            else this.tokens.push(new Token(TokenType.ASSIGN, '=', startLine, startCol));
            break;
          case '!':
            if (this.match('=')) this.tokens.push(new Token(TokenType.NEQ, '!=', startLine, startCol));
            else this.tokens.push(new Token(TokenType.NOT, '!', startLine, startCol));
            break;
          case '<':
            if (this.match('=')) this.tokens.push(new Token(TokenType.LTE, '<=', startLine, startCol));
            else this.tokens.push(new Token(TokenType.LT, '<', startLine, startCol));
            break;
          case '>':
            if (this.match('=')) this.tokens.push(new Token(TokenType.GTE, '>=', startLine, startCol));
            else this.tokens.push(new Token(TokenType.GT, '>', startLine, startCol));
            break;
          case '&':
            if (this.match('&')) this.tokens.push(new Token(TokenType.AND, '&&', startLine, startCol));
            else throw new LexerError(`Unexpected character '&'`, startLine, startCol);
            break;
          case '|':
            if (this.match('|')) this.tokens.push(new Token(TokenType.OR, '||', startLine, startCol));
            else throw new LexerError(`Unexpected character '|'`, startLine, startCol);
            break;
          default:
            throw new LexerError(`Unexpected character '${ch}'`, startLine, startCol);
        }
      }
    }
    return this.tokens;
  }
}

module.exports = { Lexer, Token, TokenType, LexerError };

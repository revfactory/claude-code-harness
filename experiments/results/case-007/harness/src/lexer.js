// MiniLang Lexer - Tokenizes source code into a token stream
const { TokenType, KEYWORDS, Token } = require('./token');
const { LexerError } = require('./errors');

class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  peek() {
    return this.pos < this.source.length ? this.source[this.pos] : '\0';
  }

  peekNext() {
    return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : '\0';
  }

  advance() {
    const ch = this.source[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  makeToken(type, value) {
    return new Token(type, value, this.line, this.column);
  }

  skipWhitespace() {
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advance();
      } else if (ch === '/' && this.peekNext() === '/') {
        // Line comment
        while (this.pos < this.source.length && this.peek() !== '\n') {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  readString() {
    const quote = this.advance(); // consume opening quote
    const startLine = this.line;
    const startCol = this.column - 1;
    let str = '';
    while (this.pos < this.source.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const esc = this.advance();
        switch (esc) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case '\\': str += '\\'; break;
          case '"': str += '"'; break;
          case "'": str += "'"; break;
          default: str += esc;
        }
      } else {
        str += this.advance();
      }
    }
    if (this.pos >= this.source.length) {
      throw new LexerError('Unterminated string', startLine, startCol);
    }
    this.advance(); // consume closing quote
    return new Token(TokenType.STRING, str, startLine, startCol);
  }

  readNumber() {
    const startCol = this.column;
    let num = '';
    let isFloat = false;
    while (this.pos < this.source.length && /[0-9]/.test(this.peek())) {
      num += this.advance();
    }
    if (this.peek() === '.' && /[0-9]/.test(this.peekNext())) {
      isFloat = true;
      num += this.advance(); // '.'
      while (this.pos < this.source.length && /[0-9]/.test(this.peek())) {
        num += this.advance();
      }
    }
    const value = isFloat ? parseFloat(num) : parseInt(num, 10);
    return new Token(TokenType.NUMBER, value, this.line, startCol);
  }

  readIdentifier() {
    const startCol = this.column;
    let id = '';
    while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.peek())) {
      id += this.advance();
    }
    const type = KEYWORDS[id] || TokenType.IDENTIFIER;
    return new Token(type, id, this.line, startCol);
  }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const ch = this.peek();
      const line = this.line;
      const col = this.column;

      // String
      if (ch === '"' || ch === "'") {
        this.tokens.push(this.readString());
        continue;
      }

      // Number
      if (/[0-9]/.test(ch)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Identifier / Keyword
      if (/[a-zA-Z_]/.test(ch)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Two-character operators
      if (ch === '=' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.tokens.push(new Token(TokenType.EQ, '==', line, col));
        continue;
      }
      if (ch === '!' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.tokens.push(new Token(TokenType.NEQ, '!=', line, col));
        continue;
      }
      if (ch === '<' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.tokens.push(new Token(TokenType.LTE, '<=', line, col));
        continue;
      }
      if (ch === '>' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.tokens.push(new Token(TokenType.GTE, '>=', line, col));
        continue;
      }
      if (ch === '&' && this.peekNext() === '&') {
        this.advance(); this.advance();
        this.tokens.push(new Token(TokenType.AND, '&&', line, col));
        continue;
      }
      if (ch === '|' && this.peekNext() === '|') {
        this.advance(); this.advance();
        this.tokens.push(new Token(TokenType.OR, '||', line, col));
        continue;
      }

      // Single-character tokens
      this.advance();
      switch (ch) {
        case '+': this.tokens.push(new Token(TokenType.PLUS, '+', line, col)); break;
        case '-': this.tokens.push(new Token(TokenType.MINUS, '-', line, col)); break;
        case '*': this.tokens.push(new Token(TokenType.STAR, '*', line, col)); break;
        case '/': this.tokens.push(new Token(TokenType.SLASH, '/', line, col)); break;
        case '%': this.tokens.push(new Token(TokenType.PERCENT, '%', line, col)); break;
        case '=': this.tokens.push(new Token(TokenType.ASSIGN, '=', line, col)); break;
        case '<': this.tokens.push(new Token(TokenType.LT, '<', line, col)); break;
        case '>': this.tokens.push(new Token(TokenType.GT, '>', line, col)); break;
        case '!': this.tokens.push(new Token(TokenType.NOT, '!', line, col)); break;
        case '(': this.tokens.push(new Token(TokenType.LPAREN, '(', line, col)); break;
        case ')': this.tokens.push(new Token(TokenType.RPAREN, ')', line, col)); break;
        case '{': this.tokens.push(new Token(TokenType.LBRACE, '{', line, col)); break;
        case '}': this.tokens.push(new Token(TokenType.RBRACE, '}', line, col)); break;
        case '[': this.tokens.push(new Token(TokenType.LBRACKET, '[', line, col)); break;
        case ']': this.tokens.push(new Token(TokenType.RBRACKET, ']', line, col)); break;
        case ',': this.tokens.push(new Token(TokenType.COMMA, ',', line, col)); break;
        case ';': this.tokens.push(new Token(TokenType.SEMICOLON, ';', line, col)); break;
        default:
          throw new LexerError(`Unexpected character: '${ch}'`, line, col);
      }
    }

    this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
    return this.tokens;
  }
}

module.exports = { Lexer };

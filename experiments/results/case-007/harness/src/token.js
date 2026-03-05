// MiniLang Token Types
const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENTIFIER: 'IDENTIFIER',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  NULL: 'NULL',
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  ASSIGN: 'ASSIGN',
  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON',
  // Keywords
  LET: 'LET',
  FN: 'FN',
  RETURN: 'RETURN',
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  FOR: 'FOR',
  // Special
  EOF: 'EOF',
};

const KEYWORDS = {
  let: TokenType.LET,
  fn: TokenType.FN,
  return: TokenType.RETURN,
  if: TokenType.IF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  for: TokenType.FOR,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  null: TokenType.NULL,
};

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column})`;
  }
}

module.exports = { TokenType, KEYWORDS, Token };

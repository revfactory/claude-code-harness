// Lexer Tests
const { Lexer } = require('../src/lexer');
const { TokenType } = require('../src/token');

function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function testTokenTypes() {
  const lexer = new Lexer('let x = 42;');
  const tokens = lexer.tokenize();
  assert(tokens[0].type === TokenType.LET, 'let keyword');
  assert(tokens[1].type === TokenType.IDENTIFIER, 'identifier x');
  assert(tokens[1].value === 'x', 'identifier value');
  assert(tokens[2].type === TokenType.ASSIGN, 'assign');
  assert(tokens[3].type === TokenType.NUMBER, 'number');
  assert(tokens[3].value === 42, 'number value');
  assert(tokens[4].type === TokenType.SEMICOLON, 'semicolon');
  assert(tokens[5].type === TokenType.EOF, 'eof');
  console.log('  PASS: basic token types');
}

function testOperators() {
  const lexer = new Lexer('+ - * / % == != < > <= >= && || !');
  const tokens = lexer.tokenize();
  const expected = [
    TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
    TokenType.PERCENT, TokenType.EQ, TokenType.NEQ, TokenType.LT,
    TokenType.GT, TokenType.LTE, TokenType.GTE, TokenType.AND,
    TokenType.OR, TokenType.NOT, TokenType.EOF
  ];
  for (let i = 0; i < expected.length; i++) {
    assert(tokens[i].type === expected[i], `operator ${expected[i]} at index ${i}`);
  }
  console.log('  PASS: operators');
}

function testStrings() {
  const lexer = new Lexer('"hello world" \'single\'');
  const tokens = lexer.tokenize();
  assert(tokens[0].type === TokenType.STRING, 'string type');
  assert(tokens[0].value === 'hello world', 'string value');
  assert(tokens[1].value === 'single', 'single quotes');
  console.log('  PASS: strings');
}

function testNumbers() {
  const lexer = new Lexer('42 3.14 0');
  const tokens = lexer.tokenize();
  assert(tokens[0].value === 42, 'integer');
  assert(tokens[1].value === 3.14, 'float');
  assert(tokens[2].value === 0, 'zero');
  console.log('  PASS: numbers');
}

function testKeywords() {
  const lexer = new Lexer('let fn return if else while for true false null');
  const tokens = lexer.tokenize();
  const expected = [
    TokenType.LET, TokenType.FN, TokenType.RETURN, TokenType.IF,
    TokenType.ELSE, TokenType.WHILE, TokenType.FOR, TokenType.TRUE,
    TokenType.FALSE, TokenType.NULL, TokenType.EOF
  ];
  for (let i = 0; i < expected.length; i++) {
    assert(tokens[i].type === expected[i], `keyword ${expected[i]}`);
  }
  console.log('  PASS: keywords');
}

function testLineColumn() {
  const lexer = new Lexer('let x\nlet y');
  const tokens = lexer.tokenize();
  assert(tokens[0].line === 1, 'line 1');
  assert(tokens[2].line === 2, 'line 2');
  console.log('  PASS: line/column tracking');
}

function testComments() {
  const lexer = new Lexer('42 // this is a comment\n43');
  const tokens = lexer.tokenize();
  assert(tokens[0].value === 42, 'before comment');
  assert(tokens[1].value === 43, 'after comment');
  console.log('  PASS: comments');
}

console.log('Lexer Tests:');
testTokenTypes();
testOperators();
testStrings();
testNumbers();
testKeywords();
testLineColumn();
testComments();
console.log('All lexer tests passed!\n');

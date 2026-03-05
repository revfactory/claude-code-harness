// Parser Tests
const { Lexer } = require('../src/lexer');
const { Parser } = require('../src/parser');

function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function parse(source) {
  const tokens = new Lexer(source).tokenize();
  return new Parser(tokens).parse();
}

function testLetStatement() {
  const ast = parse('let x = 42;');
  assert(ast.type === 'Program', 'program');
  assert(ast.body.length === 1, '1 statement');
  assert(ast.body[0].type === 'LetStatement', 'let statement');
  assert(ast.body[0].name === 'x', 'variable name');
  assert(ast.body[0].value.type === 'NumberLiteral', 'number literal');
  assert(ast.body[0].value.value === 42, 'value');
  console.log('  PASS: let statement');
}

function testBinaryExpr() {
  const ast = parse('1 + 2 * 3;');
  const expr = ast.body[0].expression;
  // Should be (1 + (2 * 3)) due to precedence
  assert(expr.type === 'BinaryExpr', 'binary expr');
  assert(expr.operator === '+', 'outer +');
  assert(expr.left.value === 1, 'left 1');
  assert(expr.right.type === 'BinaryExpr', 'right is binary');
  assert(expr.right.operator === '*', 'inner *');
  console.log('  PASS: binary expression precedence');
}

function testIfExpression() {
  const ast = parse('if (x > 0) { x; } else { 0; }');
  const expr = ast.body[0].expression;
  assert(expr.type === 'IfExpr', 'if expr');
  assert(expr.condition.type === 'BinaryExpr', 'condition');
  assert(expr.consequence.type === 'BlockStatement', 'consequence');
  assert(expr.alternative.type === 'BlockStatement', 'alternative');
  console.log('  PASS: if expression');
}

function testFunctionLiteral() {
  const ast = parse('fn add(a, b) { return a + b; }');
  const expr = ast.body[0].expression;
  assert(expr.type === 'FunctionLiteral', 'fn literal');
  assert(expr.name === 'add', 'fn name');
  assert(expr.params.length === 2, '2 params');
  assert(expr.params[0] === 'a', 'param a');
  console.log('  PASS: function literal');
}

function testAnonymousFunction() {
  const ast = parse('let f = fn(x) { return x * 2; };');
  const fn = ast.body[0].value;
  assert(fn.type === 'FunctionLiteral', 'fn literal');
  assert(fn.name === null, 'anonymous');
  assert(fn.params.length === 1, '1 param');
  console.log('  PASS: anonymous function');
}

function testArrayLiteral() {
  const ast = parse('[1, 2, 3];');
  const expr = ast.body[0].expression;
  assert(expr.type === 'ArrayLiteral', 'array literal');
  assert(expr.elements.length === 3, '3 elements');
  console.log('  PASS: array literal');
}

function testCallExpression() {
  const ast = parse('add(1, 2);');
  const expr = ast.body[0].expression;
  assert(expr.type === 'CallExpr', 'call expr');
  assert(expr.callee.name === 'add', 'callee');
  assert(expr.arguments.length === 2, '2 args');
  console.log('  PASS: call expression');
}

function testIndexExpression() {
  const ast = parse('arr[0];');
  const expr = ast.body[0].expression;
  assert(expr.type === 'IndexExpr', 'index expr');
  assert(expr.object.name === 'arr', 'object');
  assert(expr.index.value === 0, 'index');
  console.log('  PASS: index expression');
}

function testWhileStatement() {
  const ast = parse('while (i < 10) { i = i + 1; }');
  assert(ast.body[0].type === 'WhileStatement', 'while');
  console.log('  PASS: while statement');
}

function testForStatement() {
  const ast = parse('for (let i = 0; i < 10; i = i + 1) { print(i); }');
  assert(ast.body[0].type === 'ForStatement', 'for');
  assert(ast.body[0].init.type === 'LetStatement', 'for init');
  console.log('  PASS: for statement');
}

console.log('Parser Tests:');
testLetStatement();
testBinaryExpr();
testIfExpression();
testFunctionLiteral();
testAnonymousFunction();
testArrayLiteral();
testCallExpression();
testIndexExpression();
testWhileStatement();
testForStatement();
console.log('All parser tests passed!\n');

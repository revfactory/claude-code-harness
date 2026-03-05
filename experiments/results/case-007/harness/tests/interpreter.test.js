// Interpreter Tests
const { Lexer } = require('../src/lexer');
const { Parser } = require('../src/parser');
const { Interpreter } = require('../src/interpreter');

function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function run(source) {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const interp = new Interpreter();
  const result = interp.run(ast);
  return { result, output: interp.output };
}

function testArithmetic() {
  assert(run('1 + 2;').result === 3, '1+2');
  assert(run('10 - 3;').result === 7, '10-3');
  assert(run('4 * 5;').result === 20, '4*5');
  assert(run('15 / 3;').result === 5, '15/3');
  assert(run('17 % 5;').result === 2, '17%5');
  assert(run('2 + 3 * 4;').result === 14, 'precedence');
  assert(run('(2 + 3) * 4;').result === 20, 'grouping');
  assert(run('3.14 * 2;').result === 6.28, 'float');
  console.log('  PASS: arithmetic');
}

function testComparison() {
  assert(run('1 < 2;').result === true, '1<2');
  assert(run('2 > 1;').result === true, '2>1');
  assert(run('1 == 1;').result === true, '1==1');
  assert(run('1 != 2;').result === true, '1!=2');
  assert(run('1 <= 1;').result === true, '1<=1');
  assert(run('2 >= 2;').result === true, '2>=2');
  console.log('  PASS: comparison');
}

function testLogical() {
  assert(run('true && true;').result === true, 'and true');
  assert(run('true && false;').result === false, 'and false');
  assert(run('false || true;').result === true, 'or true');
  assert(run('false || false;').result === false, 'or false');
  assert(run('!true;').result === false, 'not true');
  assert(run('!false;').result === true, 'not false');
  console.log('  PASS: logical operators');
}

function testVariables() {
  assert(run('let x = 42; x;').result === 42, 'let and read');
  assert(run('let x = 1; x = 2; x;').result === 2, 'reassign');
  console.log('  PASS: variables');
}

function testStrings() {
  assert(run('"hello" + " " + "world";').result === 'hello world', 'concat');
  const { output } = run('print("test");');
  assert(output[0] === 'test', 'print string');
  console.log('  PASS: strings');
}

function testArrays() {
  assert(run('let a = [1, 2, 3]; a[0];').result === 1, 'index 0');
  assert(run('let a = [1, 2, 3]; a[2];').result === 3, 'index 2');
  assert(run('len([1, 2, 3]);').result === 3, 'len');
  const { output } = run('let a = [1, 2]; push(a, 3); print(len(a));');
  assert(output[0] === '3', 'push + len');
  console.log('  PASS: arrays');
}

function testIfElse() {
  assert(run('if (true) { 1; } else { 2; }').result === 1, 'if true');
  assert(run('if (false) { 1; } else { 2; }').result === 2, 'if false');
  assert(run('if (1 > 2) { 1; }').result === null, 'if no else');
  console.log('  PASS: if/else');
}

function testWhile() {
  const { result } = run('let i = 0; let sum = 0; while (i < 5) { sum = sum + i; i = i + 1; } sum;');
  assert(result === 10, 'while loop sum');
  console.log('  PASS: while');
}

function testFor() {
  const { output } = run(`
    let sum = 0;
    for (let i = 1; i <= 5; i = i + 1) {
      sum = sum + i;
    }
    print(sum);
  `);
  assert(output[0] === '15', 'for loop sum');
  console.log('  PASS: for');
}

function testFunctions() {
  assert(run('fn add(a, b) { return a + b; } add(3, 4);').result === 7, 'named fn');
  assert(run('let mul = fn(a, b) { return a * b; }; mul(3, 4);').result === 12, 'anon fn');
  console.log('  PASS: functions');
}

function testRecursion() {
  const { result } = run(`
    fn fib(n) {
      if (n <= 1) { return n; }
      return fib(n - 1) + fib(n - 2);
    }
    fib(10);
  `);
  assert(result === 55, 'fibonacci 10');
  console.log('  PASS: recursion');
}

function testClosure() {
  const { result } = run(`
    fn makeCounter() {
      let count = 0;
      return fn() {
        count = count + 1;
        return count;
      };
    }
    let c = makeCounter();
    c();
    c();
    c();
  `);
  assert(result === 3, 'closure counter');
  console.log('  PASS: closure');
}

function testHigherOrderFunctions() {
  const { output } = run(`
    fn map(arr, f) {
      let result = [];
      let i = 0;
      while (i < len(arr)) {
        push(result, f(arr[i]));
        i = i + 1;
      }
      return result;
    }
    fn filter(arr, pred) {
      let result = [];
      let i = 0;
      while (i < len(arr)) {
        if (pred(arr[i])) { push(result, arr[i]); }
        i = i + 1;
      }
      return result;
    }
    let nums = [1, 2, 3, 4, 5];
    let squared = map(nums, fn(x) { return x * x; });
    let evens = filter(nums, fn(x) { return x % 2 == 0; });
    print(squared);
    print(evens);
  `);
  assert(output[0] === '[1, 4, 9, 16, 25]', 'map');
  assert(output[1] === '[2, 4]', 'filter');
  console.log('  PASS: higher-order functions');
}

function testBuiltins() {
  assert(run('type(42);').result === 'int', 'type int');
  assert(run('type(3.14);').result === 'float', 'type float');
  assert(run('type("hi");').result === 'string', 'type string');
  assert(run('type(true);').result === 'bool', 'type bool');
  assert(run('type(null);').result === 'null', 'type null');
  assert(run('type([]);').result === 'array', 'type array');
  assert(run('str(42);').result === '42', 'str');
  assert(run('int("42");').result === 42, 'int');
  assert(run('len("hello");').result === 5, 'len string');
  console.log('  PASS: builtins');
}

function testUnary() {
  assert(run('-5;').result === -5, 'negate');
  assert(run('-(3 + 2);').result === -5, 'negate expr');
  console.log('  PASS: unary');
}

console.log('Interpreter Tests:');
testArithmetic();
testComparison();
testLogical();
testVariables();
testStrings();
testArrays();
testIfElse();
testWhile();
testFor();
testFunctions();
testRecursion();
testClosure();
testHigherOrderFunctions();
testBuiltins();
testUnary();
console.log('All interpreter tests passed!\n');

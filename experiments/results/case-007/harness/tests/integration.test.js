// Integration Tests - Run example programs
const fs = require('fs');
const path = require('path');
const { Lexer } = require('../src/lexer');
const { Parser } = require('../src/parser');
const { Interpreter } = require('../src/interpreter');

function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function runFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const interp = new Interpreter();
  interp.run(ast);
  return interp.output;
}

function testMapFilter() {
  const examplePath = path.join(__dirname, '..', 'examples', 'map-filter.mini');
  const output = runFile(examplePath);

  assert(output[0] === 'squared: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]', 'squared');
  assert(output[1] === 'evens: [2, 4, 6, 8, 10]', 'evens');
  assert(output[2] === 'even squared: [4, 16, 36, 64, 100]', 'even squared');
  assert(output[3] === 'sum: 55', 'sum');
  assert(output[4] === 'doubled: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]', 'doubled');
  assert(output[5] === 'tripled: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]', 'tripled');
  assert(output[6] === 'double then square: [4, 16, 36]', 'compose');
  assert(output[7] === 'done!', 'done');
  console.log('  PASS: map-filter.mini');
}

function testFibonacci() {
  const examplePath = path.join(__dirname, '..', 'examples', 'fibonacci.mini');
  const output = runFile(examplePath);

  const expected = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
  for (let i = 0; i < 10; i++) {
    assert(output[i] === `fib(${i}) = ${expected[i]}`, `fib(${i})`);
  }
  console.log('  PASS: fibonacci.mini');
}

function testClosure() {
  const examplePath = path.join(__dirname, '..', 'examples', 'closure.mini');
  const output = runFile(examplePath);

  assert(output[0] === '1', 'counter 1');
  assert(output[1] === '2', 'counter 2');
  assert(output[2] === '3', 'counter 3');
  assert(output[3] === '5', 'acc 5');
  assert(output[4] === '15', 'acc 15');
  assert(output[5] === '18', 'acc 18');
  console.log('  PASS: closure.mini');
}

console.log('Integration Tests:');
testMapFilter();
testFibonacci();
testClosure();
console.log('All integration tests passed!\n');

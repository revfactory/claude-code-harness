'use strict';

const { run } = require('./minilang');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    console.log(`        ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Mismatch'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function capture(source) {
  const output = [];
  run(source, (val) => output.push(val));
  return output;
}

// ========================
console.log('=== Lexer Tests ===');

test('Numbers', () => {
  const out = capture('print(42); print(3.14);');
  assertEqual(out[0], '42');
  assertEqual(out[1], '3.14');
});

test('Strings', () => {
  const out = capture('print("hello"); print("world");');
  assertEqual(out[0], 'hello');
  assertEqual(out[1], 'world');
});

// ========================
console.log('\n=== Variable Tests ===');

test('Let and assignment', () => {
  const out = capture('let x = 10; x = x + 1; print(x);');
  assertEqual(out[0], '11');
});

test('Multiple variables', () => {
  const out = capture('let a = 1; let b = 2; let c = a + b; print(c);');
  assertEqual(out[0], '3');
});

// ========================
console.log('\n=== Arithmetic Tests ===');

test('Basic arithmetic', () => {
  const out = capture('print(2 + 3); print(10 - 4); print(3 * 5); print(10 / 3); print(10 % 3);');
  assertEqual(out[0], '5');
  assertEqual(out[1], '6');
  assertEqual(out[2], '15');
  assert(out[3].startsWith('3.333'));
  assertEqual(out[4], '1');
});

test('Operator precedence', () => {
  const out = capture('print(2 + 3 * 4); print((2 + 3) * 4);');
  assertEqual(out[0], '14');
  assertEqual(out[1], '20');
});

test('Unary minus', () => {
  const out = capture('print(-5); print(-(3 + 2));');
  assertEqual(out[0], '-5');
  assertEqual(out[1], '-5');
});

// ========================
console.log('\n=== Comparison & Logic Tests ===');

test('Comparisons', () => {
  const out = capture('print(1 < 2); print(2 > 3); print(1 == 1); print(1 != 2); print(2 <= 2); print(3 >= 4);');
  assertEqual(out[0], 'true');
  assertEqual(out[1], 'false');
  assertEqual(out[2], 'true');
  assertEqual(out[3], 'true');
  assertEqual(out[4], 'true');
  assertEqual(out[5], 'false');
});

test('Logical operators', () => {
  const out = capture('print(true && false); print(true || false); print(!true);');
  assertEqual(out[0], 'false');
  assertEqual(out[1], 'true');
  assertEqual(out[2], 'false');
});

// ========================
console.log('\n=== Control Flow Tests ===');

test('If/else', () => {
  const out = capture('if (true) { print("yes"); } else { print("no"); }');
  assertEqual(out[0], 'yes');
});

test('Else if', () => {
  const out = capture('let x = 2; if (x == 1) { print("one"); } else if (x == 2) { print("two"); } else { print("other"); }');
  assertEqual(out[0], 'two');
});

test('While loop', () => {
  const out = capture('let i = 0; while (i < 3) { print(i); i = i + 1; }');
  assertEqual(out.join(','), '0,1,2');
});

test('For loop', () => {
  const out = capture('for (let i = 0; i < 5; i = i + 1) { print(i); }');
  assertEqual(out.join(','), '0,1,2,3,4');
});

// ========================
console.log('\n=== Function Tests ===');

test('Function declaration and call', () => {
  const out = capture('fn add(a, b) { return a + b; } print(add(3, 4));');
  assertEqual(out[0], '7');
});

test('Recursive function', () => {
  const out = capture('fn fib(n) { if (n <= 1) { return n; } return fib(n - 1) + fib(n - 2); } print(fib(10));');
  assertEqual(out[0], '55');
});

test('Anonymous function', () => {
  const out = capture('let double = fn(x) { return x * 2; }; print(double(5));');
  assertEqual(out[0], '10');
});

test('Higher-order function', () => {
  const out = capture('fn apply(f, x) { return f(x); } print(apply(fn(n) { return n * 3; }, 7));');
  assertEqual(out[0], '21');
});

// ========================
console.log('\n=== Closure Tests ===');

test('Basic closure', () => {
  const out = capture(`
    fn makeCounter() {
      let count = 0;
      fn inc() {
        count = count + 1;
        return count;
      }
      return inc;
    }
    let c = makeCounter();
    print(c());
    print(c());
    print(c());
  `);
  assertEqual(out[0], '1');
  assertEqual(out[1], '2');
  assertEqual(out[2], '3');
});

test('Multiple closures share state', () => {
  const out = capture(`
    fn makeAdder(x) {
      return fn(y) { return x + y; };
    }
    let add5 = makeAdder(5);
    let add10 = makeAdder(10);
    print(add5(3));
    print(add10(3));
  `);
  assertEqual(out[0], '8');
  assertEqual(out[1], '13');
});

// ========================
console.log('\n=== Array Tests ===');

test('Array literal and indexing', () => {
  const out = capture('let arr = [1, 2, 3]; print(arr[0]); print(arr[2]);');
  assertEqual(out[0], '1');
  assertEqual(out[1], '3');
});

test('Array assignment', () => {
  const out = capture('let arr = [1, 2, 3]; arr[1] = 99; print(arr);');
  assertEqual(out[0], '[1,99,3]');
});

test('Array with push and len', () => {
  const out = capture('let arr = []; push(arr, 10); push(arr, 20); print(len(arr)); print(arr);');
  assertEqual(out[0], '2');
  assertEqual(out[1], '[10,20]');
});

// ========================
console.log('\n=== Built-in Functions Tests ===');

test('type()', () => {
  const out = capture('print(type(42)); print(type("hi")); print(type(true)); print(type(null)); print(type([1,2]));');
  assertEqual(out[0], 'number');
  assertEqual(out[1], 'string');
  assertEqual(out[2], 'boolean');
  assertEqual(out[3], 'null');
  assertEqual(out[4], 'array');
});

test('str() and int()', () => {
  const out = capture('print(str(42)); print(int("123")); print(int(3.7));');
  assertEqual(out[0], '42');
  assertEqual(out[1], '123');
  assertEqual(out[2], '3');
});

test('String concatenation', () => {
  const out = capture('print("hello" + " " + "world");');
  assertEqual(out[0], 'hello world');
});

// ========================
console.log('\n=== Validation Test (map/filter) ===');

test('map and filter with anonymous functions', () => {
  const out = capture(`
    fn map(arr, f) {
      let result = [];
      for (let i = 0; i < len(arr); i = i + 1) {
        push(result, f(arr[i]));
      }
      return result;
    }
    fn filter(arr, pred) {
      let result = [];
      for (let i = 0; i < len(arr); i = i + 1) {
        if (pred(arr[i])) {
          push(result, arr[i]);
        }
      }
      return result;
    }
    let numbers = [1,2,3,4,5,6,7,8,9,10];
    let doubled = map(numbers, fn(x) { return x * 2; });
    let evens = filter(numbers, fn(x) { return x % 2 == 0; });
    print(doubled);
    print(evens);
  `);
  assertEqual(out[0], '[2,4,6,8,10,12,14,16,18,20]');
  assertEqual(out[1], '[2,4,6,8,10]');
});

// ========================
console.log('\n=== Error Handling Tests ===');

test('Undefined variable error', () => {
  try {
    run('print(x);');
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('Undefined variable'), e.message);
  }
});

test('Division by zero', () => {
  try {
    run('print(1 / 0);');
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('Division by zero'), e.message);
  }
});

test('Calling non-function', () => {
  try {
    run('let x = 5; x();');
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('non-function'), e.message);
  }
});

// ========================
console.log('\n=== Results ===');
console.log(`Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);

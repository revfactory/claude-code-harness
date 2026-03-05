'use strict';

const { createEngine } = require('../src/index');

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (err) {
    console.log(`  FAIL: ${name}`);
    console.log(`        ${err.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || ''}\n  Expected: ${e}\n  Actual:   ${a}`);
  }
}

console.log('\n=== Executor Tests ===\n');

// ── Setup helper ──────────────────────────────────────────
function setupEngine() {
  const engine = createEngine();
  engine.execute('CREATE TABLE users (id INT, name TEXT, age INT, city TEXT)');
  engine.execute("INSERT INTO users VALUES (1, 'Alice', 30, 'Seoul')");
  engine.execute("INSERT INTO users VALUES (2, 'Bob', 25, 'Busan')");
  engine.execute("INSERT INTO users VALUES (3, 'Charlie', 35, 'Seoul')");
  engine.execute("INSERT INTO users VALUES (4, 'Diana', 28, 'Daegu')");
  engine.execute("INSERT INTO users VALUES (5, 'Eve', 22, 'Busan')");
  return engine;
}

// ── DDL Tests ─────────────────────────────────────────────

test('CREATE TABLE', () => {
  const engine = createEngine();
  const result = engine.execute('CREATE TABLE test (id INT, name TEXT)');
  assertEqual(result.type, 'CREATE');
});

test('DROP TABLE', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE test (id INT)');
  const result = engine.execute('DROP TABLE test');
  assertEqual(result.type, 'DROP');
});

test('CREATE TABLE duplicate error', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE test (id INT)');
  try {
    engine.execute('CREATE TABLE test (id INT)');
    assert(false, 'Should throw');
  } catch (e) {
    assert(e.message.includes('already exists'));
  }
});

// ── INSERT Tests ──────────────────────────────────────────

test('INSERT INTO', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT, name TEXT)');
  const result = engine.execute("INSERT INTO t VALUES (1, 'Alice')");
  assertEqual(result.rowsAffected, 1);
});

test('INSERT with column names', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT, name TEXT, age INT)');
  engine.execute("INSERT INTO t (name, id) VALUES ('Alice', 1)");
  const result = engine.execute('SELECT * FROM t');
  assertEqual(result.rows[0].name, 'Alice');
  assertEqual(result.rows[0].id, 1);
  assertEqual(result.rows[0].age, null);
});

// ── SELECT Tests ──────────────────────────────────────────

test('SELECT *', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users');
  assertEqual(result.rows.length, 5);
});

test('SELECT specific columns', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT name, age FROM users');
  assertEqual(Object.keys(result.rows[0]).length, 2);
  assert('name' in result.rows[0]);
  assert('age' in result.rows[0]);
});

test('SELECT with alias', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT name AS user_name FROM users');
  assert('user_name' in result.rows[0]);
});

test('SELECT with WHERE =', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE name = 'Alice'");
  assertEqual(result.rows.length, 1);
  assertEqual(result.rows[0].name, 'Alice');
});

test('SELECT with WHERE >', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users WHERE age > 28');
  assertEqual(result.rows.length, 2); // Alice(30) and Charlie(35)
});

test('SELECT with WHERE AND', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE age > 25 AND city = 'Seoul'");
  assertEqual(result.rows.length, 2); // Alice and Charlie
});

test('SELECT with WHERE OR', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE age < 23 OR age > 34");
  assertEqual(result.rows.length, 2); // Eve(22) and Charlie(35)
});

test('SELECT with WHERE IN', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE city IN ('Seoul', 'Busan')");
  assertEqual(result.rows.length, 4);
});

test('SELECT with WHERE NOT IN', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE city NOT IN ('Seoul', 'Busan')");
  assertEqual(result.rows.length, 1);
  assertEqual(result.rows[0].city, 'Daegu');
});

test('SELECT with WHERE BETWEEN', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users WHERE age BETWEEN 25 AND 30');
  assertEqual(result.rows.length, 3); // Bob(25), Alice(30), Diana(28)
});

test('SELECT with WHERE LIKE', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE name LIKE 'A%'");
  assertEqual(result.rows.length, 1);
  assertEqual(result.rows[0].name, 'Alice');
});

test('SELECT with WHERE LIKE %pattern%', () => {
  const engine = setupEngine();
  const result = engine.execute("SELECT * FROM users WHERE name LIKE '%li%'");
  assertEqual(result.rows.length, 2); // Alice, Charlie
});

test('SELECT with IS NULL', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT, val TEXT)');
  engine.execute("INSERT INTO t VALUES (1, 'a')");
  engine.execute('INSERT INTO t VALUES (2, NULL)');
  const result = engine.execute('SELECT * FROM t WHERE val IS NULL');
  assertEqual(result.rows.length, 1);
  assertEqual(result.rows[0].id, 2);
});

test('SELECT with IS NOT NULL', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT, val TEXT)');
  engine.execute("INSERT INTO t VALUES (1, 'a')");
  engine.execute('INSERT INTO t VALUES (2, NULL)');
  const result = engine.execute('SELECT * FROM t WHERE val IS NOT NULL');
  assertEqual(result.rows.length, 1);
  assertEqual(result.rows[0].id, 1);
});

test('SELECT with ORDER BY ASC', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users ORDER BY age ASC');
  assertEqual(result.rows[0].name, 'Eve');    // 22
  assertEqual(result.rows[4].name, 'Charlie'); // 35
});

test('SELECT with ORDER BY DESC', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users ORDER BY age DESC');
  assertEqual(result.rows[0].name, 'Charlie'); // 35
  assertEqual(result.rows[4].name, 'Eve');     // 22
});

test('SELECT with LIMIT', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users ORDER BY id LIMIT 3');
  assertEqual(result.rows.length, 3);
});

test('SELECT with LIMIT and OFFSET', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT * FROM users ORDER BY id LIMIT 2 OFFSET 2');
  assertEqual(result.rows.length, 2);
  assertEqual(result.rows[0].id, 3);
});

test('SELECT DISTINCT', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT DISTINCT city FROM users');
  assertEqual(result.rows.length, 3); // Seoul, Busan, Daegu
});

// ── Aggregate Tests ───────────────────────────────────────

test('COUNT(*)', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT COUNT(*) AS cnt FROM users');
  assertEqual(result.rows[0].cnt, 5);
});

test('AVG()', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT AVG(age) AS avg_age FROM users');
  assertEqual(result.rows[0].avg_age, 28); // (30+25+35+28+22)/5
});

test('SUM()', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT SUM(age) AS total_age FROM users');
  assertEqual(result.rows[0].total_age, 140);
});

test('MIN() and MAX()', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT MIN(age) AS min_age, MAX(age) AS max_age FROM users');
  assertEqual(result.rows[0].min_age, 22);
  assertEqual(result.rows[0].max_age, 35);
});

test('GROUP BY', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT city, COUNT(*) AS cnt FROM users GROUP BY city ORDER BY cnt DESC');
  assertEqual(result.rows[0].cnt, 2); // Seoul or Busan
});

test('GROUP BY with HAVING', () => {
  const engine = setupEngine();
  const result = engine.execute('SELECT city, COUNT(*) AS cnt FROM users GROUP BY city HAVING COUNT(*) >= 2');
  assertEqual(result.rows.length, 2); // Seoul and Busan
});

// ── JOIN Tests ────────────────────────────────────────────

test('INNER JOIN', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE users (id INT, name TEXT)');
  engine.execute('CREATE TABLE orders (id INT, user_id INT, amount INT)');
  engine.execute("INSERT INTO users VALUES (1, 'Alice')");
  engine.execute("INSERT INTO users VALUES (2, 'Bob')");
  engine.execute("INSERT INTO users VALUES (3, 'Charlie')");
  engine.execute('INSERT INTO orders VALUES (1, 1, 100)');
  engine.execute('INSERT INTO orders VALUES (2, 1, 200)');
  engine.execute('INSERT INTO orders VALUES (3, 2, 150)');

  const result = engine.execute('SELECT u.name, o.amount FROM users u INNER JOIN orders o ON u.id = o.user_id ORDER BY o.amount');
  assertEqual(result.rows.length, 3);
  assertEqual(result.rows[0].name, 'Alice');
  assertEqual(result.rows[0].amount, 100);
});

test('LEFT JOIN', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE users (id INT, name TEXT)');
  engine.execute('CREATE TABLE orders (id INT, user_id INT, amount INT)');
  engine.execute("INSERT INTO users VALUES (1, 'Alice')");
  engine.execute("INSERT INTO users VALUES (2, 'Bob')");
  engine.execute("INSERT INTO users VALUES (3, 'Charlie')");
  engine.execute('INSERT INTO orders VALUES (1, 1, 100)');

  const result = engine.execute('SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON u.id = o.user_id ORDER BY u.id');
  assertEqual(result.rows.length, 3);
  assertEqual(result.rows[0].name, 'Alice');
  assertEqual(result.rows[0].amount, 100);
  assertEqual(result.rows[1].name, 'Bob');
  assertEqual(result.rows[1].amount, null);
  assertEqual(result.rows[2].name, 'Charlie');
  assertEqual(result.rows[2].amount, null);
});

// ── Subquery Tests ────────────────────────────────────────

test('Subquery in WHERE IN', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE users (id INT, name TEXT)');
  engine.execute('CREATE TABLE orders (id INT, user_id INT)');
  engine.execute("INSERT INTO users VALUES (1, 'Alice')");
  engine.execute("INSERT INTO users VALUES (2, 'Bob')");
  engine.execute("INSERT INTO users VALUES (3, 'Charlie')");
  engine.execute('INSERT INTO orders VALUES (1, 1)');
  engine.execute('INSERT INTO orders VALUES (2, 3)');

  const result = engine.execute('SELECT name FROM users WHERE id IN (SELECT user_id FROM orders)');
  assertEqual(result.rows.length, 2);
  const names = result.rows.map(r => r.name).sort();
  assertDeepEqual(names, ['Alice', 'Charlie']);
});

// ── UPDATE Tests ──────────────────────────────────────────

test('UPDATE with WHERE', () => {
  const engine = setupEngine();
  engine.execute("UPDATE users SET age = 31 WHERE name = 'Alice'");
  const result = engine.execute("SELECT age FROM users WHERE name = 'Alice'");
  assertEqual(result.rows[0].age, 31);
});

test('UPDATE without WHERE (all rows)', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT, val INT)');
  engine.execute('INSERT INTO t VALUES (1, 10)');
  engine.execute('INSERT INTO t VALUES (2, 20)');
  const res = engine.execute('UPDATE t SET val = 0');
  assertEqual(res.rowsAffected, 2);
});

// ── DELETE Tests ──────────────────────────────────────────

test('DELETE with WHERE', () => {
  const engine = setupEngine();
  const result = engine.execute("DELETE FROM users WHERE name = 'Eve'");
  assertEqual(result.rowsAffected, 1);
  const remaining = engine.execute('SELECT COUNT(*) AS cnt FROM users');
  assertEqual(remaining.rows[0].cnt, 4);
});

test('DELETE without WHERE', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT)');
  engine.execute('INSERT INTO t VALUES (1)');
  engine.execute('INSERT INTO t VALUES (2)');
  const result = engine.execute('DELETE FROM t');
  assertEqual(result.rowsAffected, 2);
});

// ── NULL Tests ────────────────────────────────────────────

test('NULL comparison returns NULL (3-value logic)', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE t (id INT, val INT)');
  engine.execute('INSERT INTO t VALUES (1, NULL)');
  // NULL = NULL should not match
  const result = engine.execute('SELECT * FROM t WHERE val = NULL');
  assertEqual(result.rows.length, 0);
});

// ── Arithmetic Tests ──────────────────────────────────────

test('Arithmetic in SELECT', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE items (price INT, qty INT)');
  engine.execute('INSERT INTO items VALUES (10, 5)');
  const result = engine.execute('SELECT price * qty AS total FROM items');
  assertEqual(result.rows[0].total, 50);
});

// ── Empty table ───────────────────────────────────────────

test('SELECT from empty table', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE empty_t (id INT)');
  const result = engine.execute('SELECT * FROM empty_t');
  assertEqual(result.rows.length, 0);
});

test('COUNT on empty table', () => {
  const engine = createEngine();
  engine.execute('CREATE TABLE empty_t (id INT)');
  const result = engine.execute('SELECT COUNT(*) AS cnt FROM empty_t');
  assertEqual(result.rows[0].cnt, 0);
});

console.log('\nExecutor tests complete.\n');

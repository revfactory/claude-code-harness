'use strict';

const { Lexer } = require('../src/lexer');
const { Parser } = require('../src/parser');

function parse(sql) {
  const lexer = new Lexer(sql);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

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

console.log('\n=== Parser Tests ===\n');

test('CREATE TABLE', () => {
  const [stmt] = parse('CREATE TABLE users (id INT PRIMARY KEY, name TEXT, age INT)');
  assertEqual(stmt.type, 'CreateTableStatement');
  assertEqual(stmt.name, 'users');
  assertEqual(stmt.columns.length, 3);
  assertEqual(stmt.columns[0].primaryKey, true);
  assertEqual(stmt.columns[1].dataType, 'TEXT');
});

test('DROP TABLE', () => {
  const [stmt] = parse('DROP TABLE users');
  assertEqual(stmt.type, 'DropTableStatement');
  assertEqual(stmt.name, 'users');
});

test('INSERT INTO with columns', () => {
  const [stmt] = parse("INSERT INTO users (name, age) VALUES ('Alice', 30)");
  assertEqual(stmt.type, 'InsertStatement');
  assertEqual(stmt.table, 'users');
  assertEqual(stmt.columns.length, 2);
  assertEqual(stmt.values[0].length, 2);
});

test('INSERT INTO without columns', () => {
  const [stmt] = parse("INSERT INTO users VALUES (1, 'Bob', 25)");
  assertEqual(stmt.type, 'InsertStatement');
  assert(stmt.columns === null);
  assertEqual(stmt.values[0].length, 3);
});

test('Simple SELECT', () => {
  const [stmt] = parse('SELECT * FROM users');
  assertEqual(stmt.type, 'SelectStatement');
  assertEqual(stmt.columns[0].expr.name, '*');
  assertEqual(stmt.from.name, 'users');
});

test('SELECT with WHERE', () => {
  const [stmt] = parse('SELECT name, age FROM users WHERE age > 18');
  assertEqual(stmt.type, 'SelectStatement');
  assertEqual(stmt.columns.length, 2);
  assertEqual(stmt.where.op, '>');
});

test('SELECT with AND/OR', () => {
  const [stmt] = parse('SELECT * FROM users WHERE age > 18 AND name = \'Alice\' OR age < 10');
  assertEqual(stmt.where.op, 'OR');
});

test('SELECT with ORDER BY', () => {
  const [stmt] = parse('SELECT * FROM users ORDER BY age DESC, name ASC');
  assertEqual(stmt.orderBy.length, 2);
  assertEqual(stmt.orderBy[0].direction, 'DESC');
  assertEqual(stmt.orderBy[1].direction, 'ASC');
});

test('SELECT with LIMIT/OFFSET', () => {
  const [stmt] = parse('SELECT * FROM users LIMIT 10 OFFSET 5');
  assertEqual(stmt.limit, 10);
  assertEqual(stmt.offset, 5);
});

test('SELECT with GROUP BY and HAVING', () => {
  const [stmt] = parse('SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 3');
  assertEqual(stmt.groupBy.length, 1);
  assert(stmt.having !== null);
  assertEqual(stmt.having.op, '>');
});

test('SELECT with JOIN', () => {
  const [stmt] = parse('SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id');
  assert(stmt.from.joins.length === 1);
  assertEqual(stmt.from.joins[0].joinType, 'INNER');
});

test('SELECT with LEFT JOIN', () => {
  const [stmt] = parse('SELECT u.name FROM users u LEFT JOIN orders o ON u.id = o.user_id');
  assertEqual(stmt.from.joins[0].joinType, 'LEFT');
});

test('SELECT DISTINCT', () => {
  const [stmt] = parse('SELECT DISTINCT city FROM users');
  assertEqual(stmt.distinct, true);
});

test('SELECT with IN', () => {
  const [stmt] = parse("SELECT * FROM users WHERE age IN (20, 30, 40)");
  assertEqual(stmt.where.type, 'InExpr');
  assertEqual(stmt.where.values.length, 3);
});

test('SELECT with BETWEEN', () => {
  const [stmt] = parse('SELECT * FROM users WHERE age BETWEEN 18 AND 65');
  assertEqual(stmt.where.type, 'BetweenExpr');
});

test('SELECT with LIKE', () => {
  const [stmt] = parse("SELECT * FROM users WHERE name LIKE 'A%'");
  assertEqual(stmt.where.type, 'LikeExpr');
  assertEqual(stmt.where.pattern, 'A%');
});

test('SELECT with IS NULL', () => {
  const [stmt] = parse('SELECT * FROM users WHERE email IS NULL');
  assertEqual(stmt.where.type, 'IsNullExpr');
  assertEqual(stmt.where.negated, false);
});

test('SELECT with IS NOT NULL', () => {
  const [stmt] = parse('SELECT * FROM users WHERE email IS NOT NULL');
  assertEqual(stmt.where.type, 'IsNullExpr');
  assertEqual(stmt.where.negated, true);
});

test('SELECT with subquery in WHERE', () => {
  const [stmt] = parse('SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)');
  assertEqual(stmt.where.type, 'InExpr');
  assertEqual(stmt.where.values.type, 'Subquery');
});

test('SELECT with aggregate functions', () => {
  const [stmt] = parse('SELECT COUNT(*), AVG(age), SUM(salary), MIN(age), MAX(age) FROM employees');
  assertEqual(stmt.columns.length, 5);
  assertEqual(stmt.columns[0].expr.type, 'Aggregate');
  assertEqual(stmt.columns[0].expr.fn, 'COUNT');
});

test('SELECT with alias', () => {
  const [stmt] = parse('SELECT name AS user_name, age AS user_age FROM users');
  assertEqual(stmt.columns[0].alias, 'user_name');
  assertEqual(stmt.columns[1].alias, 'user_age');
});

test('UPDATE statement', () => {
  const [stmt] = parse("UPDATE users SET name = 'Bob', age = 30 WHERE id = 1");
  assertEqual(stmt.type, 'UpdateStatement');
  assertEqual(stmt.table, 'users');
  assertEqual(stmt.assignments.length, 2);
});

test('DELETE statement', () => {
  const [stmt] = parse('DELETE FROM users WHERE id = 1');
  assertEqual(stmt.type, 'DeleteStatement');
  assertEqual(stmt.table, 'users');
});

test('NOT IN expression', () => {
  const [stmt] = parse('SELECT * FROM users WHERE age NOT IN (20, 30)');
  assertEqual(stmt.where.type, 'InExpr');
  assertEqual(stmt.where.negated, true);
});

test('NOT BETWEEN expression', () => {
  const [stmt] = parse('SELECT * FROM users WHERE age NOT BETWEEN 18 AND 25');
  assertEqual(stmt.where.type, 'BetweenExpr');
  assertEqual(stmt.where.negated, true);
});

test('Arithmetic expressions', () => {
  const [stmt] = parse('SELECT price * quantity AS total FROM items');
  assertEqual(stmt.columns[0].expr.op, '*');
  assertEqual(stmt.columns[0].alias, 'total');
});

console.log('\nParser tests complete.\n');

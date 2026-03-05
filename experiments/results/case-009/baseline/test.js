const { Database } = require('./sql-engine');

const db = new Database();
let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}`);
    console.log(`    Expected: ${e}`);
    console.log(`    Actual:   ${a}`);
    failed++;
  }
}

console.log('=== DDL & INSERT ===');
db.execute("CREATE TABLE employees (id INT, name TEXT, dept TEXT, salary FLOAT)");
db.execute("INSERT INTO employees VALUES (1,'Alice','Engineering',90000)");
db.execute("INSERT INTO employees VALUES (2,'Bob','Engineering',85000)");
db.execute("INSERT INTO employees VALUES (3,'Charlie','Marketing',75000)");
db.execute("INSERT INTO employees VALUES (4,'Diana','Engineering',95000)");
db.execute("INSERT INTO employees VALUES (5,'Eve','Marketing',80000)");
db.execute("INSERT INTO employees VALUES (6,'Frank','Sales',70000)");
assert('6 rows inserted', db.tables.employees.rows.length, 6);

console.log('\n=== SELECT * ===');
const all = db.execute("SELECT * FROM employees");
assert('SELECT * returns 6 rows', all.length, 6);
assert('First row name', all[0].name, 'Alice');

console.log('\n=== SELECT specific columns ===');
const names = db.execute("SELECT name, salary FROM employees");
assert('Has 2 columns', Object.keys(names[0]).length, 2);

console.log('\n=== SELECT with alias ===');
const aliased = db.execute("SELECT name AS employee_name FROM employees");
assert('Alias works', aliased[0].employee_name, 'Alice');

console.log('\n=== DISTINCT ===');
const depts = db.execute("SELECT DISTINCT dept FROM employees");
assert('3 distinct depts', depts.length, 3);

console.log('\n=== WHERE comparison ===');
const highSalary = db.execute("SELECT name FROM employees WHERE salary > 80000");
assert('3 employees with salary > 80000', highSalary.length, 3);

console.log('\n=== WHERE AND/OR ===');
const andOr = db.execute("SELECT name FROM employees WHERE dept = 'Engineering' AND salary > 85000");
assert('AND filter', andOr.length, 2); // Alice(90k), Diana(95k)

console.log('\n=== WHERE LIKE ===');
const like = db.execute("SELECT name FROM employees WHERE name LIKE 'A%'");
assert('LIKE A%', like.length, 1);
assert('LIKE result', like[0].name, 'Alice');

console.log('\n=== WHERE IN ===');
const inList = db.execute("SELECT name FROM employees WHERE dept IN ('Engineering','Sales')");
assert('IN list', inList.length, 4);

console.log('\n=== WHERE BETWEEN ===');
const between = db.execute("SELECT name FROM employees WHERE salary BETWEEN 75000 AND 85000");
assert('BETWEEN', between.length, 3);

console.log('\n=== IS NULL ===');
db.execute("CREATE TABLE nullable_test (id INT, val TEXT)");
db.execute("INSERT INTO nullable_test VALUES (1, 'hello')");
db.execute("INSERT INTO nullable_test VALUES (2, NULL)");
const nullRows = db.execute("SELECT id FROM nullable_test WHERE val IS NULL");
assert('IS NULL', nullRows.length, 1);
assert('IS NULL id', nullRows[0].id, 2);
const notNullRows = db.execute("SELECT id FROM nullable_test WHERE val IS NOT NULL");
assert('IS NOT NULL', notNullRows.length, 1);

console.log('\n=== ORDER BY ===');
const ordered = db.execute("SELECT name, salary FROM employees ORDER BY salary DESC");
assert('ORDER BY DESC first', ordered[0].name, 'Diana');
assert('ORDER BY DESC last', ordered[5].name, 'Frank');

console.log('\n=== LIMIT / OFFSET ===');
const limited = db.execute("SELECT name FROM employees ORDER BY salary DESC LIMIT 2");
assert('LIMIT 2', limited.length, 2);
const offsetted = db.execute("SELECT name FROM employees ORDER BY salary DESC LIMIT 2 OFFSET 1");
assert('OFFSET 1', offsetted[0].name, 'Alice');

console.log('\n=== Aggregates without GROUP BY ===');
const count = db.execute("SELECT COUNT(*) as cnt FROM employees");
assert('COUNT(*)', count[0].cnt, 6);
const avgSal = db.execute("SELECT AVG(salary) as avg_sal FROM employees");
assert('AVG', avgSal[0].avg_sal, 82500);
const sumSal = db.execute("SELECT SUM(salary) as total FROM employees");
assert('SUM', sumSal[0].total, 495000);
const minSal = db.execute("SELECT MIN(salary) as min_sal FROM employees");
assert('MIN', minSal[0].min_sal, 70000);
const maxSal = db.execute("SELECT MAX(salary) as max_sal FROM employees");
assert('MAX', maxSal[0].max_sal, 95000);

console.log('\n=== GROUP BY + HAVING (validation query) ===');
const grouped = db.execute("SELECT dept, COUNT(*) as count, AVG(salary) as avg_salary FROM employees GROUP BY dept HAVING AVG(salary) >= 80000 ORDER BY avg_salary DESC");
assert('GROUP BY HAVING returns 1 group', grouped.length, 1);
assert('Department is Engineering', grouped[0].dept, 'Engineering');
assert('Count is 3', grouped[0].count, 3);
assert('Avg salary is 90000', grouped[0].avg_salary, 90000);

console.log('\n=== JOIN ===');
db.execute("CREATE TABLE departments (name TEXT, building TEXT)");
db.execute("INSERT INTO departments VALUES ('Engineering', 'Building A')");
db.execute("INSERT INTO departments VALUES ('Marketing', 'Building B')");
db.execute("INSERT INTO departments VALUES ('HR', 'Building C')");

const innerJoin = db.execute("SELECT employees.name, departments.building FROM employees JOIN departments ON employees.dept = departments.name");
assert('INNER JOIN count', innerJoin.length, 5); // 3 eng + 2 mkt, Sales not in departments

const leftJoin = db.execute("SELECT employees.name, departments.building FROM employees LEFT JOIN departments ON employees.dept = departments.name");
assert('LEFT JOIN count', leftJoin.length, 6); // Frank gets null building

console.log('\n=== Subquery: WHERE IN (SELECT ...) ===');
const subq = db.execute("SELECT name FROM employees WHERE dept IN (SELECT name FROM departments)");
assert('Subquery IN', subq.length, 5); // Engineering(3) + Marketing(2)

console.log('\n=== UPDATE ===');
db.execute("UPDATE employees SET salary = 92000 WHERE name = 'Alice'");
const updated = db.execute("SELECT salary FROM employees WHERE name = 'Alice'");
assert('UPDATE', updated[0].salary, 92000);

console.log('\n=== DELETE ===');
db.execute("DELETE FROM employees WHERE name = 'Frank'");
const afterDelete = db.execute("SELECT * FROM employees");
assert('DELETE', afterDelete.length, 5);

console.log('\n=== DROP TABLE ===');
db.execute("DROP TABLE nullable_test");
assert('DROP TABLE', db.tables.nullable_test, undefined);

console.log(`\n=============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`=============================`);

if (failed > 0) process.exit(1);

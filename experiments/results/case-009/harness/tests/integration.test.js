'use strict';

const { createEngine } = require('../src/index');
const { Formatter } = require('../src/formatter');

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

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n=== Integration Tests ===\n');

// ── Setup: Company Database ──────────────────────────────

function setupCompanyDB() {
  const engine = createEngine();

  // Create tables
  engine.execute(`
    CREATE TABLE departments (
      id INT PRIMARY KEY,
      name TEXT,
      budget INT
    )
  `);

  engine.execute(`
    CREATE TABLE employees (
      id INT PRIMARY KEY,
      name TEXT,
      dept_id INT,
      salary INT,
      hire_year INT
    )
  `);

  engine.execute(`
    CREATE TABLE projects (
      id INT PRIMARY KEY,
      name TEXT,
      lead_id INT,
      budget INT
    )
  `);

  // Insert departments
  engine.execute("INSERT INTO departments VALUES (1, 'Engineering', 500000)");
  engine.execute("INSERT INTO departments VALUES (2, 'Marketing', 200000)");
  engine.execute("INSERT INTO departments VALUES (3, 'Finance', 300000)");
  engine.execute("INSERT INTO departments VALUES (4, 'HR', 150000)");

  // Insert employees
  engine.execute("INSERT INTO employees VALUES (1, 'Kim', 1, 85000, 2018)");
  engine.execute("INSERT INTO employees VALUES (2, 'Lee', 1, 92000, 2017)");
  engine.execute("INSERT INTO employees VALUES (3, 'Park', 2, 65000, 2019)");
  engine.execute("INSERT INTO employees VALUES (4, 'Choi', 1, 78000, 2020)");
  engine.execute("INSERT INTO employees VALUES (5, 'Jung', 3, 88000, 2016)");
  engine.execute("INSERT INTO employees VALUES (6, 'Kang', 2, 72000, 2018)");
  engine.execute("INSERT INTO employees VALUES (7, 'Yoon', 3, 95000, 2015)");
  engine.execute("INSERT INTO employees VALUES (8, 'Shin', 1, 105000, 2014)");
  engine.execute("INSERT INTO employees VALUES (9, 'Han', 2, 58000, 2021)");
  engine.execute("INSERT INTO employees VALUES (10, 'Seo', 4, 62000, 2020)");

  // Insert projects
  engine.execute("INSERT INTO projects VALUES (1, 'Alpha', 1, 100000)");
  engine.execute("INSERT INTO projects VALUES (2, 'Beta', 2, 80000)");
  engine.execute("INSERT INTO projects VALUES (3, 'Gamma', 5, 120000)");
  engine.execute("INSERT INTO projects VALUES (4, 'Delta', 8, 200000)");

  return engine;
}

// ── 검증 쿼리 1: 부서별 통계 (GROUP BY + HAVING + ORDER BY + Aggregates) ──

test('검증 쿼리 1: 부서별 직원 통계', () => {
  const engine = setupCompanyDB();

  const result = engine.execute(`
    SELECT d.name AS dept_name,
           COUNT(*) AS emp_count,
           AVG(e.salary) AS avg_salary,
           MAX(e.salary) AS max_salary,
           MIN(e.salary) AS min_salary
    FROM employees e
    INNER JOIN departments d ON e.dept_id = d.id
    GROUP BY d.name
    HAVING COUNT(*) >= 2
    ORDER BY avg_salary DESC
  `);

  console.log('\n    --- 부서별 통계 결과 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Engineering: Kim(85k), Lee(92k), Choi(78k), Shin(105k) = 4명, avg=90000
  // Marketing: Park(65k), Kang(72k), Han(58k) = 3명, avg=65000
  // Finance: Jung(88k), Yoon(95k) = 2명, avg=91500
  // HR: Seo(62k) = 1명 → HAVING 걸림

  assertEqual(result.rows.length, 3, 'Should have 3 departments with >= 2 employees');

  // Ordered by avg_salary DESC: Finance(91500) > Engineering(90000) > Marketing(65000)
  assertEqual(result.rows[0].dept_name, 'Finance');
  assertEqual(result.rows[0].emp_count, 2);
  assertEqual(result.rows[0].avg_salary, 91500);

  assertEqual(result.rows[1].dept_name, 'Engineering');
  assertEqual(result.rows[1].emp_count, 4);
  assertEqual(result.rows[1].max_salary, 105000);
  assertEqual(result.rows[1].min_salary, 78000);

  assertEqual(result.rows[2].dept_name, 'Marketing');
  assertEqual(result.rows[2].emp_count, 3);
});

// ── 검증 쿼리 2: JOIN + 서브쿼리 ────────────────────────

test('검증 쿼리 2: 프로젝트 리더 정보 (JOIN + 서브쿼리)', () => {
  const engine = setupCompanyDB();

  const result = engine.execute(`
    SELECT e.name AS leader_name,
           d.name AS dept_name,
           e.salary
    FROM employees e
    INNER JOIN departments d ON e.dept_id = d.id
    WHERE e.id IN (SELECT lead_id FROM projects)
    ORDER BY e.salary DESC
  `);

  console.log('\n    --- 프로젝트 리더 정보 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Project leaders: Kim(1), Lee(2), Jung(5), Shin(8)
  assertEqual(result.rows.length, 4);

  // Ordered by salary DESC: Shin(105k), Lee(92k), Jung(88k), Kim(85k)
  assertEqual(result.rows[0].leader_name, 'Shin');
  assertEqual(result.rows[0].salary, 105000);
  assertEqual(result.rows[0].dept_name, 'Engineering');

  assertEqual(result.rows[3].leader_name, 'Kim');
  assertEqual(result.rows[3].salary, 85000);
});

// ── 검증 쿼리 3: LEFT JOIN으로 프로젝트 없는 직원 찾기 ──

test('검증 쿼리 3: LEFT JOIN + IS NULL (프로젝트 없는 직원)', () => {
  const engine = setupCompanyDB();

  // 직원 테이블과 프로젝트 테이블을 LEFT JOIN하여 프로젝트가 없는 직원 찾기
  const result = engine.execute(`
    SELECT e.name, e.salary
    FROM employees e
    LEFT JOIN projects p ON e.id = p.lead_id
    WHERE p.id IS NULL
    ORDER BY e.name
  `);

  console.log('\n    --- 프로젝트 미배정 직원 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Leaders: 1(Kim), 2(Lee), 5(Jung), 8(Shin)
  // Non-leaders: 3(Park), 4(Choi), 6(Kang), 7(Yoon), 9(Han), 10(Seo) = 6명
  assertEqual(result.rows.length, 6);
  assertEqual(result.rows[0].name, 'Choi');
  assertEqual(result.rows[5].name, 'Yoon');
});

// ── 검증 쿼리 4: DISTINCT + LIKE + BETWEEN 복합 ──────

test('검증 쿼리 4: 복합 WHERE (LIKE + BETWEEN)', () => {
  const engine = setupCompanyDB();

  const result = engine.execute(`
    SELECT DISTINCT e.name, e.salary
    FROM employees e
    WHERE e.salary BETWEEN 70000 AND 100000
      AND e.hire_year >= 2017
    ORDER BY e.salary DESC
  `);

  console.log('\n    --- 2017년 이후 입사 & 급여 7만~10만 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Kim(85k, 2018), Lee(92k, 2017), Choi(78k, 2020), Kang(72k, 2018)
  assertEqual(result.rows.length, 4);
  assertEqual(result.rows[0].name, 'Lee');    // 92000
  assertEqual(result.rows[3].name, 'Kang');   // 72000
});

// ── 검증 쿼리 5: UPDATE + 재조회 ─────────────────────────

test('검증 쿼리 5: UPDATE 후 재조회', () => {
  const engine = setupCompanyDB();

  // 엔지니어링 부서 전원 10% 인상
  engine.execute('UPDATE employees SET salary = salary + salary * 10 / 100 WHERE dept_id = 1');

  const result = engine.execute(`
    SELECT name, salary
    FROM employees
    WHERE dept_id = 1
    ORDER BY salary DESC
  `);

  console.log('\n    --- 엔지니어링 부서 인상 후 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Shin: 105000 * 1.1 = 115500
  // Lee: 92000 * 1.1 = 101200
  // Kim: 85000 * 1.1 = 93500
  // Choi: 78000 * 1.1 = 85800
  assertEqual(result.rows[0].name, 'Shin');
  // Integer arithmetic: salary + salary * 10 / 100
  // 105000 + 105000 * 10 / 100 = 105000 + 10500 = 115500
  assertEqual(result.rows[0].salary, 115500);
  assertEqual(result.rows.length, 4);
});

// ── 검증 쿼리 6: DELETE + COUNT ──────────────────────────

test('검증 쿼리 6: DELETE 후 COUNT', () => {
  const engine = setupCompanyDB();

  engine.execute('DELETE FROM employees WHERE hire_year < 2017');

  const result = engine.execute('SELECT COUNT(*) AS cnt FROM employees');

  console.log('\n    --- 2017년 이전 입사자 삭제 후 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Removed: Jung(2016), Yoon(2015), Shin(2014) = 3명
  // Remaining: 10 - 3 = 7
  assertEqual(result.rows[0].cnt, 7);
});

// ── 검증 쿼리 7: GROUP BY 집계 + SUM ─────────────────────

test('검증 쿼리 7: 부서별 총 급여 (GROUP BY + SUM)', () => {
  const engine = setupCompanyDB();

  const result = engine.execute(`
    SELECT d.name AS dept,
           SUM(e.salary) AS total_salary
    FROM employees e
    INNER JOIN departments d ON e.dept_id = d.id
    GROUP BY d.name
    ORDER BY total_salary DESC
  `);

  console.log('\n    --- 부서별 총 급여 ---');
  console.log('    ' + Formatter.formatResult(result).split('\n').join('\n    '));

  // Engineering: 85000+92000+78000+105000 = 360000
  // Finance: 88000+95000 = 183000
  // Marketing: 65000+72000+58000 = 195000
  // HR: 62000
  assertEqual(result.rows[0].dept, 'Engineering');
  assertEqual(result.rows[0].total_salary, 360000);
  assertEqual(result.rows.length, 4);
});

console.log('\nIntegration tests complete.\n');

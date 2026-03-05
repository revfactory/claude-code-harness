/**
 * 2사이트 동기화 테스트 (비충돌 시나리오)
 */
const { Site } = require('../src/site');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.log(`  FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const match = actual === expected;
  if (!match) {
    console.log(`    expected: "${expected}", got: "${actual}"`);
  }
  assert(match, message);
}

console.log('=== Sync Tests (비충돌) ===\n');

// 테스트 1: 순차적 삽입 후 동기화
console.log('--- 순차 삽입 동기화 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  // A가 먼저 "Hi" 입력
  siteA.insert(0, 'H');
  siteA.insert(1, 'i');

  // A -> B 동기화
  siteA.sync(siteB);

  assertEqual(siteA.getText(), 'Hi', 'A: Hi');
  assertEqual(siteB.getText(), 'Hi', 'B: Hi (동기화 후)');

  // B가 뒤에 "!" 추가
  siteB.insert(2, '!');

  // B -> A 동기화
  siteB.sync(siteA);

  assertEqual(siteA.getText(), 'Hi!', 'A: Hi! (동기화 후)');
  assertEqual(siteB.getText(), 'Hi!', 'B: Hi!');
}

// 테스트 2: 서로 다른 위치에 삽입 (비충돌)
console.log('\n--- 서로 다른 위치에 삽입 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  // 초기 상태: "AB" 공유
  siteA.insert(0, 'A');
  siteA.insert(1, 'B');
  siteA.sync(siteB);

  // A: "AXB" (중간에 X 삽입), B: "ABY" (뒤에 Y 삽입)
  siteA.insert(1, 'X'); // A 뒤에
  siteB.insert(2, 'Y'); // B 뒤에

  siteA.sync(siteB);

  assertEqual(siteA.getText(), siteB.getText(), '수렴: 두 사이트 텍스트 일치');
  // "AXYB" or "AXBY" - 위치가 다르므로 결과 확인
  const text = siteA.getText();
  assert(text.includes('X') && text.includes('Y'), '양쪽 삽입 모두 반영');
}

// 테스트 3: 삭제 동기화
console.log('\n--- 삭제 동기화 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  // 초기: "ABC"
  siteA.insert(0, 'A');
  siteA.insert(1, 'B');
  siteA.insert(2, 'C');
  siteA.sync(siteB);

  assertEqual(siteB.getText(), 'ABC', 'B 초기 동기화');

  // A가 'B' 삭제
  siteA.delete(1);
  siteA.sync(siteB);

  assertEqual(siteA.getText(), 'AC', 'A: AC');
  assertEqual(siteB.getText(), 'AC', 'B: AC (삭제 동기화)');
}

// 테스트 4: 연속 동기화
console.log('\n--- 연속 동기화 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  siteA.insert(0, 'H');
  siteA.sync(siteB);

  siteB.insert(1, 'e');
  siteB.sync(siteA);

  siteA.insert(2, 'l');
  siteA.sync(siteB);

  siteB.insert(3, 'l');
  siteB.sync(siteA);

  siteA.insert(4, 'o');
  siteA.sync(siteB);

  assertEqual(siteA.getText(), 'Hello', 'A: Hello');
  assertEqual(siteB.getText(), 'Hello', 'B: Hello');
}

// 테스트 5: 빈 동기화 (pendingOps 없음)
console.log('\n--- 빈 동기화 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  siteA.insert(0, 'X');
  siteA.sync(siteB);

  // 추가 연산 없이 다시 동기화
  siteA.sync(siteB);

  assertEqual(siteA.getText(), 'X', 'A: 변화 없음');
  assertEqual(siteB.getText(), 'X', 'B: 변화 없음');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);

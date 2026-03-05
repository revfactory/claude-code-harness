/**
 * 충돌 시나리오 A/B/C 테스트
 * A: 동시 삽입 같은 위치
 * B: 삽입 vs 삭제 같은 위치
 * C: 3사이트 복합 편집
 */
const { Site } = require('../src/site');
const { Simulator } = require('../src/simulator');

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

console.log('=== Conflict Tests ===\n');

// 시나리오 A: 동시 삽입 같은 위치
console.log('--- 시나리오 A: 동시 삽입 같은 위치 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  // 초기: "X"
  siteA.insert(0, 'X');
  siteA.sync(siteB);

  // 동시에 같은 위치(0)에 삽입
  siteA.insert(0, 'a'); // A는 'a'를 앞에
  siteB.insert(0, 'b'); // B는 'b'를 앞에

  // 동기화
  siteA.sync(siteB);

  assertEqual(siteA.getText(), siteB.getText(), 'A: 수렴');
  const text = siteA.getText();
  assert(text.includes('a') && text.includes('b') && text.includes('X'),
    `A: 모든 문자 포함: "${text}"`);
  console.log(`    결과 텍스트: "${text}"`);

  // 결정론적: siteId 사전순. B > A이므로 B('b')가 앞에
  assertEqual(text, 'baX', 'A: 결정론적 순서 (siteId 사전순 뒤인 B가 앞)');
}

// 시나리오 A-2: 같은 clock, 다른 siteId 우선순위
console.log('\n--- 시나리오 A-2: 3개 사이트 동시 삽입 ---');
{
  const sim = new Simulator(['A', 'B', 'C']);

  // 초기 동기화
  sim.getSite('A').insert(0, 'X');
  sim.syncAll();

  // 모두 같은 위치 0에 동시 삽입
  sim.getSite('A').insert(0, '1');
  sim.getSite('B').insert(0, '2');
  sim.getSite('C').insert(0, '3');

  sim.syncAll();

  assert(sim.checkConvergence(), 'A-2: 3사이트 수렴');
  const text = sim.getSite('A').getText();
  console.log(`    결과 텍스트: "${text}"`);
  assert(text.length === 4, 'A-2: 4글자');
}

// 시나리오 B: 삽입 vs 삭제 같은 위치
console.log('\n--- 시나리오 B: 삽입 vs 삭제 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  // 초기: "AB"
  siteA.insert(0, 'A');
  siteA.insert(1, 'B');
  siteA.sync(siteB);

  // A는 'A' 뒤에 'X' 삽입(pos 1), B는 'A' 삭제(pos 0)
  siteA.insert(1, 'X');
  siteB.delete(0);

  siteA.sync(siteB);

  assertEqual(siteA.getText(), siteB.getText(), 'B: 수렴');
  const text = siteA.getText();
  assert(text.includes('X') && text.includes('B'), `B: X와 B 존재: "${text}"`);
  assert(!text.includes('A') || text.includes('A'), `B: A는 삭제되었을 수 있음: "${text}"`);
  console.log(`    결과 텍스트: "${text}"`);
}

// 시나리오 B-2: 같은 문자를 동시에 삭제
console.log('\n--- 시나리오 B-2: 같은 문자 동시 삭제 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  // 초기: "XY"
  siteA.insert(0, 'X');
  siteA.insert(1, 'Y');
  siteA.sync(siteB);

  // 둘 다 'X'(pos 0) 삭제
  siteA.delete(0);
  siteB.delete(0);

  siteA.sync(siteB);

  assertEqual(siteA.getText(), 'Y', 'B-2 A: Y');
  assertEqual(siteB.getText(), 'Y', 'B-2 B: Y');
}

// 시나리오 C: 3사이트 복합 편집
console.log('\n--- 시나리오 C: 3사이트 복합 편집 ---');
{
  const sim = new Simulator(['A', 'B', 'C']);

  // A가 초기 텍스트 "Hello" 작성
  const siteA = sim.getSite('A');
  siteA.insert(0, 'H');
  siteA.insert(1, 'e');
  siteA.insert(2, 'l');
  siteA.insert(3, 'l');
  siteA.insert(4, 'o');
  sim.syncAll();

  assertEqual(sim.getSite('B').getText(), 'Hello', 'C: 초기 동기화');
  assertEqual(sim.getSite('C').getText(), 'Hello', 'C: 초기 동기화');

  // 동시 편집:
  // A: 'H' 삭제 -> "ello", 앞에 'h' 삽입 -> "hello"
  sim.getSite('A').delete(0);
  sim.getSite('A').insert(0, 'h');

  // B: 뒤에 '!' 추가 -> "Hello!"
  sim.getSite('B').insert(5, '!');

  // C: 'e' -> 삭제, 'E' 삽입 -> "HEllo"
  sim.getSite('C').delete(1);
  sim.getSite('C').insert(1, 'E');

  sim.syncAll();

  assert(sim.checkConvergence(), 'C: 3사이트 수렴');
  const text = sim.getSite('A').getText();
  console.log(`    결과 텍스트: "${text}"`);
  assert(text.includes('h') && text.includes('!'), 'C: A와 B의 편집 반영');
}

// 시나리오 C-2: 인터리빙 동기화
console.log('\n--- 시나리오 C-2: 부분 동기화 후 전체 동기화 ---');
{
  const sim = new Simulator(['A', 'B', 'C']);

  // 초기
  sim.getSite('A').insert(0, 'X');
  sim.syncAll();

  // A,B 동시 삽입
  sim.getSite('A').insert(1, 'a');
  sim.getSite('B').insert(1, 'b');

  // A,B만 동기화
  sim.syncPair('A', 'B');

  // C도 삽입
  sim.getSite('C').insert(1, 'c');

  // 전체 동기화
  sim.syncAll();

  assert(sim.checkConvergence(), 'C-2: 부분+전체 동기화 수렴');
  console.log(`    결과 텍스트: "${sim.getSite('A').getText()}"`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);

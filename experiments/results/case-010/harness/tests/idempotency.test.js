/**
 * 멱등성 및 인과성 검증 테스트
 */
const { Site } = require('../src/site');
const { VectorClock } = require('../src/vector-clock');

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

console.log('=== Idempotency & Causality Tests ===\n');

// 멱등성 1: 같은 연산 두 번 적용해도 결과 동일
console.log('--- 멱등성: 삽입 중복 적용 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  const op1 = siteA.insert(0, 'H');
  const op2 = siteA.insert(1, 'i');

  const ops = [op1, op2];

  // 같은 연산을 3번 적용
  siteB.receiveOps(ops);
  siteB.receiveOps(ops);
  siteB.receiveOps(ops);

  assertEqual(siteB.getText(), 'Hi', '삽입 3회 적용해도 Hi');
  assertEqual(siteB.doc.getNodeCount(), 2, '노드 수 2');
}

// 멱등성 2: 삭제 중복 적용
console.log('\n--- 멱등성: 삭제 중복 적용 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  siteA.insert(0, 'A');
  siteA.insert(1, 'B');
  siteA.insert(2, 'C');
  siteA.sync(siteB);

  const delOp = siteA.delete(1); // 'B' 삭제

  // 같은 삭제 연산 3번
  siteB.receiveOps([delOp]);
  siteB.receiveOps([delOp]);
  siteB.receiveOps([delOp]);

  assertEqual(siteB.getText(), 'AC', '삭제 3회 적용해도 AC');
}

// 멱등성 3: 혼합 연산 중복
console.log('\n--- 멱등성: 혼합 연산 중복 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');
  const siteC = new Site('C');

  siteA.insert(0, 'X');
  siteA.insert(1, 'Y');

  const opsA = [...siteA.pendingOps];

  // B와 C에 같은 연산을 여러 번
  siteB.receiveOps(opsA);
  siteC.receiveOps(opsA);
  siteB.receiveOps(opsA); // 중복
  siteC.receiveOps(opsA); // 중복

  assertEqual(siteB.getText(), 'XY', 'B: 멱등성 유지');
  assertEqual(siteC.getText(), 'XY', 'C: 멱등성 유지');
}

// 멱등성 4: 연산 순서 무관
console.log('\n--- 멱등성: 연산 순서 바꿔 적용 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');
  const siteC = new Site('C');

  const op1 = siteA.insert(0, 'A');
  const op2 = siteA.insert(1, 'B');
  const op3 = siteA.insert(2, 'C');

  // B: 정순 적용
  siteB.receiveOps([op1, op2, op3]);

  // C: 역순 적용 (각각 따로)
  siteC.receiveOps([op3]);
  siteC.receiveOps([op2]);
  siteC.receiveOps([op1]);

  assertEqual(siteB.getText(), 'ABC', 'B: 정순 ABC');
  assertEqual(siteC.getText(), 'ABC', 'C: 역순에도 ABC');
}

// 인과성: Lamport clock 증가
console.log('\n--- 인과성: Lamport clock ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');

  siteA.insert(0, 'X');
  siteA.insert(1, 'Y');
  assertEqual(siteA.doc.clock, 2, 'A clock: 2');

  siteA.sync(siteB);
  // B의 clock은 max(0, 2) + 1 = 3 (두 연산 적용 후)
  assert(siteB.doc.clock >= 2, `B clock >= 2: ${siteB.doc.clock}`);

  siteB.insert(2, 'Z');
  assert(siteB.doc.clock > 2, `B clock > 2 after insert: ${siteB.doc.clock}`);
}

// VectorClock 단위 테스트
console.log('\n--- VectorClock ---');
{
  const vc1 = new VectorClock();
  const vc2 = new VectorClock();

  vc1.increment('A');
  vc1.increment('A');
  vc1.increment('B');

  assertEqual(vc1.get('A'), 2, 'vc1.A = 2');
  assertEqual(vc1.get('B'), 1, 'vc1.B = 1');
  assertEqual(vc1.get('C'), 0, 'vc1.C = 0 (없음)');

  vc2.increment('A');
  vc2.increment('C');

  assert(vc2.isConcurrent(vc1), 'vc1, vc2 동시 발생');

  vc2.merge(vc1);
  assertEqual(vc2.get('A'), 2, '병합 후 A = 2');
  assertEqual(vc2.get('B'), 1, '병합 후 B = 1');
  assertEqual(vc2.get('C'), 1, '병합 후 C = 1');

  const vc3 = new VectorClock();
  vc3.increment('A');
  const vc4 = vc3.clone();
  vc4.increment('A');
  assert(vc3.happensBefore(vc4), 'vc3 -> vc4');
  assert(!vc4.happensBefore(vc3), 'vc4 -/-> vc3');
}

// 인과성 보존: 동기화 후 clock 정합성
console.log('\n--- 인과성 보존: 다중 동기화 ---');
{
  const siteA = new Site('A');
  const siteB = new Site('B');
  const siteC = new Site('C');

  const op1 = siteA.insert(0, '1');
  const op2 = siteA.insert(1, '2');
  const clockAfterA = siteA.doc.clock;

  // A의 연산을 보관한 뒤 동기화
  const opsFromA = [op1, op2];
  siteA.sync(siteB);
  const clockBAfterSync = siteB.doc.clock;
  assert(clockBAfterSync > clockAfterA, `B clock (${clockBAfterSync}) > A 원래 clock (${clockAfterA})`);

  siteB.insert(2, '3');
  // C에 A의 연산도 명시적으로 전달 (실제 네트워크에서는 전체 이력 전송)
  siteC.receiveOps(opsFromA);
  siteB.sync(siteC);
  const clockCAfterSync = siteC.doc.clock;
  assert(clockCAfterSync > clockBAfterSync, `C clock (${clockCAfterSync}) > B sync clock (${clockBAfterSync})`);

  assertEqual(siteC.getText(), '123', 'C: 인과 순서 보존된 123');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);

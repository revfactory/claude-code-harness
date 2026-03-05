/**
 * 기본 단일 사이트 테스트
 * 삽입, 삭제, getText 동작 검증
 */
const { CRDTDocument } = require('../src/crdt-document');
const { CharId } = require('../src/char-id');
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

console.log('=== Basic Tests ===\n');

// CharId 테스트
console.log('--- CharId ---');
{
  const id1 = new CharId('A', 1);
  const id2 = new CharId('B', 1);
  const id3 = new CharId('A', 2);

  assert(id1.equals(new CharId('A', 1)), 'CharId equals: 동일 ID');
  assert(!id1.equals(id2), 'CharId equals: 다른 siteId');
  assert(!id1.equals(id3), 'CharId equals: 다른 clock');
  assert(id1.compareTo(id2) < 0, 'CharId compareTo: 같은 clock, siteId 사전순');
  assert(id1.compareTo(id3) < 0, 'CharId compareTo: 다른 clock');
  assert(id3.compareTo(id1) > 0, 'CharId compareTo: 큰 clock이 크다');
  assertEqual(id1.toString(), 'A:1', 'CharId toString');
}

// 단일 사이트 삽입
console.log('\n--- 단일 사이트 삽입 ---');
{
  const doc = new CRDTDocument('A');
  doc.localInsert(0, 'H');
  assertEqual(doc.getText(), 'H', '한 글자 삽입');

  doc.localInsert(1, 'i');
  assertEqual(doc.getText(), 'Hi', '뒤에 삽입');

  doc.localInsert(0, '!');
  assertEqual(doc.getText(), '!Hi', '앞에 삽입');

  doc.localInsert(2, 'X');
  assertEqual(doc.getText(), '!HXi', '중간에 삽입');
}

// 단일 사이트 삭제
console.log('\n--- 단일 사이트 삭제 ---');
{
  const doc = new CRDTDocument('A');
  doc.localInsert(0, 'A');
  doc.localInsert(1, 'B');
  doc.localInsert(2, 'C');
  assertEqual(doc.getText(), 'ABC', '삭제 전');

  doc.localDelete(1); // 'B' 삭제
  assertEqual(doc.getText(), 'AC', '중간 삭제');

  doc.localDelete(0); // 'A' 삭제
  assertEqual(doc.getText(), 'C', '앞 삭제');

  doc.localDelete(0); // 'C' 삭제
  assertEqual(doc.getText(), '', '전부 삭제');
}

// tombstone 유지 확인
console.log('\n--- Tombstone 유지 ---');
{
  const doc = new CRDTDocument('A');
  doc.localInsert(0, 'X');
  doc.localInsert(1, 'Y');
  doc.localDelete(0); // 'X' tombstone
  assertEqual(doc.getText(), 'Y', 'tombstone 후 getText');
  assertEqual(doc.getNodeCount(), 2, '노드 수는 여전히 2 (tombstone 포함)');
  assertEqual(doc.getVisibleCount(), 1, '가시 노드는 1');
}

// Site 래퍼
console.log('\n--- Site 래퍼 ---');
{
  const site = new Site('A');
  site.insert(0, 'H');
  site.insert(1, 'e');
  site.insert(2, 'l');
  site.insert(3, 'l');
  site.insert(4, 'o');
  assertEqual(site.getText(), 'Hello', 'Site insert');

  site.delete(1); // 'e' 삭제
  assertEqual(site.getText(), 'Hllo', 'Site delete');
  assertEqual(site.pendingOps.length, 6, 'pendingOps 누적');

  const flushed = site.flushOps();
  assertEqual(flushed.length, 6, 'flushOps 반환');
  assertEqual(site.pendingOps.length, 0, 'flushOps 후 비어있음');
}

// 범위 초과 에러
console.log('\n--- 범위 초과 에러 ---');
{
  const doc = new CRDTDocument('A');
  let threw = false;
  try {
    doc.localDelete(0);
  } catch (e) {
    threw = true;
  }
  assert(threw, '빈 문서에서 삭제 시 에러');

  doc.localInsert(0, 'A');
  threw = false;
  try {
    doc.localInsert(5, 'X');
  } catch (e) {
    threw = true;
  }
  assert(threw, '범위 초과 삽입 시 에러');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);

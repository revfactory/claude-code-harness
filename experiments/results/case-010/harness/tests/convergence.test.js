/**
 * 수렴성 검증 테스트
 * 랜덤 연산 퍼즈 테스트로 수렴 보장 확인
 */
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

console.log('=== Convergence Tests ===\n');

// 테스트 1: 2사이트 랜덤 10회
console.log('--- 2사이트 랜덤 10회 ---');
{
  const sim = new Simulator(['A', 'B']);
  sim.randomOps('A', 10, 42);
  sim.randomOps('B', 10, 99);
  sim.syncAll();

  assert(sim.checkConvergence(), '2사이트 랜덤 10회 수렴');
  console.log(`    텍스트: "${sim.getSite('A').getText()}"`);
}

// 테스트 2: 3사이트 랜덤 20회
console.log('\n--- 3사이트 랜덤 20회 ---');
{
  const sim = new Simulator(['A', 'B', 'C']);
  sim.randomOps('A', 20, 1);
  sim.randomOps('B', 20, 2);
  sim.randomOps('C', 20, 3);
  sim.syncAll();

  assert(sim.checkConvergence(), '3사이트 랜덤 20회 수렴');
  const status = sim.getStatus();
  console.log(`    A: "${status['A'].text}" (nodes: ${status['A'].nodeCount})`);
  console.log(`    B: "${status['B'].text}" (nodes: ${status['B'].nodeCount})`);
  console.log(`    C: "${status['C'].text}" (nodes: ${status['C'].nodeCount})`);
}

// 테스트 3: 5사이트 랜덤 50회
console.log('\n--- 5사이트 랜덤 50회 ---');
{
  const sim = new Simulator(['S1', 'S2', 'S3', 'S4', 'S5']);
  for (let i = 0; i < 5; i++) {
    sim.randomOps(`S${i + 1}`, 50, (i + 1) * 17);
  }
  sim.syncAll();

  assert(sim.checkConvergence(), '5사이트 랜덤 50회 수렴');
  console.log(`    텍스트 길이: ${sim.getSite('S1').getText().length}`);
}

// 테스트 4: 점진적 동기화 (여러 라운드)
console.log('\n--- 점진적 동기화 (5라운드) ---');
{
  const sim = new Simulator(['X', 'Y', 'Z']);

  for (let round = 0; round < 5; round++) {
    sim.randomOps('X', 5, round * 100 + 1);
    sim.randomOps('Y', 5, round * 100 + 2);
    sim.randomOps('Z', 5, round * 100 + 3);
    sim.syncAll();

    assert(sim.checkConvergence(), `라운드 ${round + 1}: 수렴`);
  }
  console.log(`    최종 텍스트: "${sim.getSite('X').getText()}"`);
}

// 테스트 5: 대량 연산 스트레스
console.log('\n--- 대량 연산 (3사이트 x 100회) ---');
{
  const sim = new Simulator(['P', 'Q', 'R']);
  sim.randomOps('P', 100, 777);
  sim.randomOps('Q', 100, 888);
  sim.randomOps('R', 100, 999);
  sim.syncAll();

  assert(sim.checkConvergence(), '3사이트 100회 수렴');
  const text = sim.getSite('P').getText();
  console.log(`    텍스트 길이: ${text.length}, 노드 수: ${sim.getSite('P').doc.getNodeCount()}`);
}

// 테스트 6: 다양한 시드에서 항상 수렴
console.log('\n--- 10개 시드 수렴 검증 ---');
{
  let allConverged = true;
  for (let seed = 0; seed < 10; seed++) {
    const sim = new Simulator(['A', 'B']);
    sim.randomOps('A', 30, seed * 31);
    sim.randomOps('B', 30, seed * 37);
    sim.syncAll();

    if (!sim.checkConvergence()) {
      allConverged = false;
      console.log(`    시드 ${seed}: 수렴 실패!`);
    }
  }
  assert(allConverged, '10개 시드 모두 수렴');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);

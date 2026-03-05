// 리팩토링 동일성 검증 + 단위 테스트
const assert = require('assert');
const { calc } = require('./original');
const {
  applyDiscount,
  calculateTax,
  applyBulkDiscount,
  updateHistory,
  calculateLineItem,
  calculateOrder,
} = require('./calculator');
const {
  PricingStrategy,
  WholesalePricingStrategy,
  VipPricingStrategy,
  createPricingStrategy,
} = require('./pricingStrategies');
const { ORDER_CONSTANTS } = require('./constants');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`    ${e.message}`);
  }
}

function assertDeepEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${msg || 'Assertion failed'}\n      expected: ${b}\n      actual:   ${a}`);
  }
}

function assertClose(actual, expected, epsilon = 1e-10, msg) {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

// ============================================================
// 1. 원본 vs 리팩토링 동일성 테스트
// ============================================================
console.log('\n=== 원본 vs 리팩토링 동일성 테스트 ===');

function compareResults(description, items, tax, disc, type, mem1, mem2) {
  test(description, () => {
    const original = calc(items, tax, disc, type, mem1);
    const refactored = calculateOrder(items, tax, disc, type, mem2);
    assertDeepEqual(refactored.items, original.items, 'items 불일치');
    assertClose(refactored.grandTotal, original.grandTotal, 1e-10, 'grandTotal 불일치');
    if (mem1 && mem2) {
      assertDeepEqual(mem2, mem1, 'history 불일치');
    }
  });
}

const sampleItems = [
  { name: 'Widget', price: 100, qty: 10 },
  { name: 'Gadget', price: 200, qty: 5 },
  { name: 'Doohickey', price: 50, qty: 150 },
];

// 일반 고객
compareResults('일반 고객, 할인 없음, 세금 10%', sampleItems, 10, 0, 'regular', {}, {});
compareResults('일반 고객, 할인 5%, 세금 10%', sampleItems, 10, 5, 'regular', {}, {});

// 도매 고객
compareResults('도매 고객, 할인 없음, 세금 10%', sampleItems, 10, 0, 'wholesale', {}, {});
compareResults('도매 고객, 할인 10%, 세금 8%', sampleItems, 8, 10, 'wholesale', {}, {});

// VIP 고객
compareResults('VIP 고객, 할인 없음, 세금 10%', sampleItems, 10, 0, 'vip', {}, {});
compareResults('VIP 고객, 할인 15%, 세금 5%', sampleItems, 5, 15, 'vip', {}, {});

// history null
compareResults('history가 null인 경우', sampleItems, 10, 5, 'wholesale', null, null);

// 빈 배열
compareResults('빈 항목 배열', [], 10, 5, 'regular', {}, {});

// 대량 주문 (grandTotal > 10000)
const bigItems = [
  { name: 'Expensive', price: 5000, qty: 3 },
  { name: 'Pricey', price: 3000, qty: 2 },
];
compareResults('대량 주문 할인 적용 (> 10000)', bigItems, 10, 0, 'regular', {}, {});

// 단일 항목
compareResults('단일 항목', [{ name: 'Solo', price: 300, qty: 1 }], 7, 3, 'vip', {}, {});

// ============================================================
// 2. 전략 패턴 단위 테스트
// ============================================================
console.log('\n=== 전략 패턴 단위 테스트 ===');

test('PricingStrategy: 가격 변동 없음', () => {
  const s = new PricingStrategy();
  assertClose(s.adjustPrice(100, 200), 100);
});

test('WholesalePricingStrategy: qty > 100 -> 20% 할인', () => {
  const s = new WholesalePricingStrategy();
  assertClose(s.adjustPrice(100, 101), 80);
});

test('WholesalePricingStrategy: qty > 50 -> 10% 할인', () => {
  const s = new WholesalePricingStrategy();
  assertClose(s.adjustPrice(100, 51), 90);
});

test('WholesalePricingStrategy: qty <= 50 -> 할인 없음', () => {
  const s = new WholesalePricingStrategy();
  assertClose(s.adjustPrice(100, 50), 100);
});

test('VipPricingStrategy: 15% 할인', () => {
  const s = new VipPricingStrategy();
  assertClose(s.adjustPrice(100, 1), 85);
});

test('createPricingStrategy: 알 수 없는 타입 -> 기본 전략', () => {
  const s = createPricingStrategy('unknown');
  assert.ok(s instanceof PricingStrategy);
  assertClose(s.adjustPrice(100, 999), 100);
});

// ============================================================
// 3. SRP 함수 단위 테스트
// ============================================================
console.log('\n=== SRP 함수 단위 테스트 ===');

test('applyDiscount: 할인율 0이면 그대로', () => {
  assertClose(applyDiscount(1000, 0), 1000);
});

test('applyDiscount: 10% 할인', () => {
  assertClose(applyDiscount(1000, 10), 900);
});

test('calculateTax: 세금 10%', () => {
  assertClose(calculateTax(1000, 10), 100);
});

test('calculateTax: 세금 0%', () => {
  assertClose(calculateTax(1000, 0), 0);
});

test('applyBulkDiscount: 10000 이하 -> 할인 없음', () => {
  assertClose(applyBulkDiscount(10000), 10000);
});

test('applyBulkDiscount: 10000 초과 -> 5% 할인', () => {
  assertClose(applyBulkDiscount(20000), 19000);
});

test('updateHistory: 새 항목 추가', () => {
  const h = {};
  updateHistory(h, 'A', 100);
  assertClose(h['A'], 100);
});

test('updateHistory: 기존 항목 누적', () => {
  const h = { A: 100 };
  updateHistory(h, 'A', 50);
  assertClose(h['A'], 150);
});

test('updateHistory: null history -> 에러 없음', () => {
  updateHistory(null, 'A', 100); // should not throw
});

// ============================================================
// 4. 경계값 테스트
// ============================================================
console.log('\n=== 경계값 테스트 ===');

test('도매 qty=50 경계: 할인 없음', () => {
  const items = [{ name: 'X', price: 100, qty: 50 }];
  const orig = calc(items, 10, 0, 'wholesale', null);
  const refac = calculateOrder(items, 10, 0, 'wholesale', null);
  assertClose(refac.grandTotal, orig.grandTotal);
});

test('도매 qty=51 경계: 10% 할인', () => {
  const items = [{ name: 'X', price: 100, qty: 51 }];
  const orig = calc(items, 10, 0, 'wholesale', null);
  const refac = calculateOrder(items, 10, 0, 'wholesale', null);
  assertClose(refac.grandTotal, orig.grandTotal);
});

test('도매 qty=100 경계: 10% 할인', () => {
  const items = [{ name: 'X', price: 100, qty: 100 }];
  const orig = calc(items, 10, 0, 'wholesale', null);
  const refac = calculateOrder(items, 10, 0, 'wholesale', null);
  assertClose(refac.grandTotal, orig.grandTotal);
});

test('도매 qty=101 경계: 20% 할인', () => {
  const items = [{ name: 'X', price: 100, qty: 101 }];
  const orig = calc(items, 10, 0, 'wholesale', null);
  const refac = calculateOrder(items, 10, 0, 'wholesale', null);
  assertClose(refac.grandTotal, orig.grandTotal);
});

test('grandTotal 정확히 10000: 대량 할인 미적용', () => {
  // price * qty * (1 + tax/100) = 10000 -> price=100, qty=100, tax=0 -> total=10000
  const items = [{ name: 'X', price: 100, qty: 100 }];
  const refac = calculateOrder(items, 0, 0, 'regular', null);
  assertClose(refac.grandTotal, 10000);
});

test('grandTotal 10001: 대량 할인 적용', () => {
  const items = [{ name: 'X', price: 100.01, qty: 100 }];
  const orig = calc(items, 0, 0, 'regular', null);
  const refac = calculateOrder(items, 0, 0, 'regular', null);
  assertClose(refac.grandTotal, orig.grandTotal);
});

// ============================================================
// 결과 출력
// ============================================================
console.log(`\n=== 결과: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);

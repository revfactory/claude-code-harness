/**
 * 리팩토링 전후 동일 입출력 보장 테스트
 */
const { calc } = require('./original');
const { calculateOrder } = require('./calculator');
const {
  applyDiscount,
  calculateTax,
  applyGrandTotalDiscount,
  updatePurchaseHistory,
} = require('./calculator');
const { wholesalePricing, vipPricing, defaultPricing, getPricingStrategy } = require('./pricingStrategies');
const {
  WHOLESALE_LARGE_QUANTITY_THRESHOLD,
  WHOLESALE_MEDIUM_QUANTITY_THRESHOLD,
  GRAND_TOTAL_DISCOUNT_THRESHOLD,
} = require('./constants');

// ──────────────────────────────────────────────
// 테스트 데이터 세트
// ──────────────────────────────────────────────
const testCases = [
  {
    name: '기본 주문 (할인 없음)',
    items: [
      { name: '사과', price: 100, qty: 10 },
      { name: '바나나', price: 200, qty: 5 },
    ],
    tax: 10,
    disc: 0,
    type: 'regular',
  },
  {
    name: '도매 - 대량 (qty > 100)',
    items: [
      { name: '볼트', price: 50, qty: 200 },
      { name: '너트', price: 30, qty: 150 },
    ],
    tax: 10,
    disc: 5,
    type: 'wholesale',
  },
  {
    name: '도매 - 중량 (50 < qty <= 100)',
    items: [
      { name: '와셔', price: 20, qty: 80 },
    ],
    tax: 8,
    disc: 0,
    type: 'wholesale',
  },
  {
    name: '도매 - 소량 (qty <= 50, 할인 없음)',
    items: [
      { name: '스크류', price: 10, qty: 30 },
    ],
    tax: 10,
    disc: 0,
    type: 'wholesale',
  },
  {
    name: 'VIP 고객',
    items: [
      { name: '노트북', price: 1500, qty: 2 },
      { name: '마우스', price: 50, qty: 3 },
    ],
    tax: 10,
    disc: 10,
    type: 'vip',
  },
  {
    name: '총액 10000 초과 (대량 할인 적용)',
    items: [
      { name: '모니터', price: 500, qty: 20 },
    ],
    tax: 10,
    disc: 0,
    type: 'regular',
  },
  {
    name: '총액 10000 이하 (대량 할인 미적용)',
    items: [
      { name: '키보드', price: 80, qty: 5 },
    ],
    tax: 10,
    disc: 0,
    type: 'regular',
  },
  {
    name: '빈 항목 배열',
    items: [],
    tax: 10,
    disc: 5,
    type: 'vip',
  },
  {
    name: '할인율 0, 세율 0',
    items: [
      { name: '연필', price: 2, qty: 100 },
    ],
    tax: 0,
    disc: 0,
    type: 'regular',
  },
  {
    name: '복합 시나리오 - 여러 항목 혼합',
    items: [
      { name: 'A', price: 100, qty: 200 },
      { name: 'B', price: 50, qty: 75 },
      { name: 'C', price: 10, qty: 10 },
    ],
    tax: 12,
    disc: 3,
    type: 'wholesale',
  },
];

// ──────────────────────────────────────────────
// 1. 원본 vs 리팩토링 동일 출력 검증
// ──────────────────────────────────────────────
console.log('=== 동일 입출력 보장 테스트 ===\n');

let allPassed = true;

for (const tc of testCases) {
  // mem 객체 두 벌 준비
  const memOriginal = {};
  const memRefactored = {};

  const originalResult = calc(tc.items, tc.tax, tc.disc, tc.type, memOriginal);
  const refactoredResult = calculateOrder(tc.items, tc.tax, tc.disc, tc.type, memRefactored);

  const itemsMatch = JSON.stringify(originalResult.items) === JSON.stringify(refactoredResult.items);
  const grandTotalMatch = originalResult.grandTotal === refactoredResult.grandTotal;
  const memMatch = JSON.stringify(memOriginal) === JSON.stringify(memRefactored);

  const passed = itemsMatch && grandTotalMatch && memMatch;
  if (!passed) allPassed = false;

  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tc.name}`);
  if (!passed) {
    if (!itemsMatch) {
      console.log('  items 불일치:');
      console.log('    원본:', JSON.stringify(originalResult.items));
      console.log('    리팩:', JSON.stringify(refactoredResult.items));
    }
    if (!grandTotalMatch) {
      console.log(`  grandTotal 불일치: 원본=${originalResult.grandTotal}, 리팩=${refactoredResult.grandTotal}`);
    }
    if (!memMatch) {
      console.log('  구매이력 불일치:');
      console.log('    원본:', JSON.stringify(memOriginal));
      console.log('    리팩:', JSON.stringify(memRefactored));
    }
  }
}

// mem=null 케이스
const origNull = calc([{ name: 'X', price: 10, qty: 1 }], 10, 0, 'regular', null);
const refacNull = calculateOrder([{ name: 'X', price: 10, qty: 1 }], 10, 0, 'regular', null);
const nullPassed = JSON.stringify(origNull) === JSON.stringify(refacNull);
if (!nullPassed) allPassed = false;
console.log(`[${nullPassed ? 'PASS' : 'FAIL'}] mem=null 전달 시`);

// mem=undefined 케이스
const origUndef = calc([{ name: 'Y', price: 5, qty: 2 }], 5, 0, 'regular', undefined);
const refacUndef = calculateOrder([{ name: 'Y', price: 5, qty: 2 }], 5, 0, 'regular', undefined);
const undefPassed = JSON.stringify(origUndef) === JSON.stringify(refacUndef);
if (!undefPassed) allPassed = false;
console.log(`[${undefPassed ? 'PASS' : 'FAIL'}] mem=undefined 전달 시`);

// ──────────────────────────────────────────────
// 2. 단위 테스트: 개별 함수
// ──────────────────────────────────────────────
console.log('\n=== 단위 테스트 ===\n');

// applyDiscount
function testApplyDiscount() {
  let pass = true;
  if (applyDiscount(1000, 10) !== 900) pass = false;
  if (applyDiscount(1000, 0) !== 1000) pass = false;
  if (applyDiscount(500, 50) !== 250) pass = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] applyDiscount`);
  if (!pass) allPassed = false;
}

// calculateTax
function testCalculateTax() {
  let pass = true;
  if (calculateTax(1000, 10) !== 100) pass = false;
  if (calculateTax(1000, 0) !== 0) pass = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] calculateTax`);
  if (!pass) allPassed = false;
}

// applyGrandTotalDiscount
function testGrandTotalDiscount() {
  let pass = true;
  if (applyGrandTotalDiscount(20000) !== 19000) pass = false;
  if (applyGrandTotalDiscount(10000) !== 10000) pass = false;
  if (applyGrandTotalDiscount(5000) !== 5000) pass = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] applyGrandTotalDiscount`);
  if (!pass) allPassed = false;
}

// pricingStrategies
function testPricingStrategies() {
  let pass = true;
  // wholesale
  if (wholesalePricing(100, 200) !== 80) pass = false;
  if (wholesalePricing(100, 75) !== 90) pass = false;
  if (wholesalePricing(100, 30) !== 100) pass = false;
  // vip
  if (vipPricing(100, 1) !== 85) pass = false;
  // default
  if (defaultPricing(100, 999) !== 100) pass = false;
  // strategy selection
  if (getPricingStrategy('wholesale') !== wholesalePricing) pass = false;
  if (getPricingStrategy('vip') !== vipPricing) pass = false;
  if (getPricingStrategy('regular') !== defaultPricing) pass = false;
  if (getPricingStrategy(undefined) !== defaultPricing) pass = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] pricingStrategies`);
  if (!pass) allPassed = false;
}

// updatePurchaseHistory
function testUpdatePurchaseHistory() {
  let pass = true;
  const hist = {};
  updatePurchaseHistory(hist, '사과', 100);
  if (hist['사과'] !== 100) pass = false;
  updatePurchaseHistory(hist, '사과', 50);
  if (hist['사과'] !== 150) pass = false;
  // null safety
  updatePurchaseHistory(null, '사과', 100);  // should not throw
  console.log(`[${pass ? 'PASS' : 'FAIL'}] updatePurchaseHistory`);
  if (!pass) allPassed = false;
}

testApplyDiscount();
testCalculateTax();
testGrandTotalDiscount();
testPricingStrategies();
testUpdatePurchaseHistory();

// ──────────────────────────────────────────────
// 최종 결과
// ──────────────────────────────────────────────
console.log(`\n=== 최종 결과: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
process.exit(allPassed ? 0 : 1);

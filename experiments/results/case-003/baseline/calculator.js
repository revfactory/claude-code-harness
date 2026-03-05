/**
 * 주문 계산기 - SRP 원칙에 따라 분리된 함수들
 */
const { GRAND_TOTAL_DISCOUNT_THRESHOLD, GRAND_TOTAL_DISCOUNT_RATE } = require('./constants');
const { getPricingStrategy } = require('./pricingStrategies');

/**
 * 할인율(%)을 소계에 적용
 */
function applyDiscount(subtotal, discountPercent) {
  if (discountPercent > 0) {
    return subtotal - (subtotal * discountPercent / 100);
  }
  return subtotal;
}

/**
 * 세금 계산
 */
function calculateTax(subtotal, taxPercent) {
  return subtotal * taxPercent / 100;
}

/**
 * 단일 항목의 명세를 계산
 */
function calculateLineItem(item, taxPercent, discountPercent, pricingStrategy) {
  const adjustedPrice = pricingStrategy(item.price, item.qty);
  const rawSubtotal = adjustedPrice * item.qty;
  const discountedSubtotal = applyDiscount(rawSubtotal, discountPercent);
  const tax = calculateTax(discountedSubtotal, taxPercent);
  const total = discountedSubtotal + tax;

  return {
    name: item.name,
    price: adjustedPrice,
    qty: item.qty,
    subtotal: discountedSubtotal,
    tax,
    total,
  };
}

/**
 * 대량 주문 시 총액 할인 적용
 */
function applyGrandTotalDiscount(grandTotal) {
  if (grandTotal > GRAND_TOTAL_DISCOUNT_THRESHOLD) {
    return grandTotal - (grandTotal * GRAND_TOTAL_DISCOUNT_RATE);
  }
  return grandTotal;
}

/**
 * 구매 이력(memo) 업데이트
 */
function updatePurchaseHistory(purchaseHistory, itemName, itemTotal) {
  if (!purchaseHistory) return;
  if (!purchaseHistory[itemName]) {
    purchaseHistory[itemName] = 0;
  }
  purchaseHistory[itemName] += itemTotal;
}

/**
 * 주문 전체를 계산하는 메인 함수
 * 원본 calc() 함수와 동일한 입출력을 보장
 *
 * @param {Array} items - 상품 목록 [{name, price, qty}, ...]
 * @param {number} taxPercent - 세율 (%)
 * @param {number} discountPercent - 추가 할인율 (%)
 * @param {string} customerType - 고객 유형 ('wholesale', 'vip', 등)
 * @param {Object|null} purchaseHistory - 구매 이력 누적 객체 (선택)
 * @returns {{items: Array, grandTotal: number}}
 */
function calculateOrder(items, taxPercent, discountPercent, customerType, purchaseHistory) {
  const pricingStrategy = getPricingStrategy(customerType);
  const processedItems = [];
  let grandTotal = 0;

  for (let i = 0; i < items.length; i++) {
    const lineItem = calculateLineItem(items[i], taxPercent, discountPercent, pricingStrategy);
    grandTotal += lineItem.total;
    processedItems.push(lineItem);
    updatePurchaseHistory(purchaseHistory, items[i].name, lineItem.total);
  }

  grandTotal = applyGrandTotalDiscount(grandTotal);

  return { items: processedItems, grandTotal };
}

module.exports = {
  applyDiscount,
  calculateTax,
  calculateLineItem,
  applyGrandTotalDiscount,
  updatePurchaseHistory,
  calculateOrder,
};

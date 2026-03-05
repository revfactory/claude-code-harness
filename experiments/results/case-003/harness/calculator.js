// 주문 계산기 - SRP 원칙에 따라 분리된 순수 함수들
const { ORDER_CONSTANTS } = require('./constants');
const { createPricingStrategy } = require('./pricingStrategies');

/**
 * 할인을 적용한다.
 * @param {number} amount - 원래 금액
 * @param {number} discountPercent - 할인율 (%)
 * @returns {number} 할인 적용된 금액
 */
function applyDiscount(amount, discountPercent) {
  if (discountPercent > 0) {
    return amount - (amount * discountPercent / ORDER_CONSTANTS.PERCENT_DIVISOR);
  }
  return amount;
}

/**
 * 세금을 계산한다.
 * @param {number} amount - 과세 대상 금액
 * @param {number} taxRate - 세율 (%)
 * @returns {number} 세금 금액
 */
function calculateTax(amount, taxRate) {
  return amount * taxRate / ORDER_CONSTANTS.PERCENT_DIVISOR;
}

/**
 * 대량 주문 할인을 적용한다.
 * @param {number} grandTotal - 총 금액
 * @returns {number} 대량 할인 적용된 총 금액
 */
function applyBulkDiscount(grandTotal) {
  if (grandTotal > ORDER_CONSTANTS.BULK_ORDER_THRESHOLD) {
    return grandTotal - (grandTotal * ORDER_CONSTANTS.BULK_ORDER_DISCOUNT_RATE);
  }
  return grandTotal;
}

/**
 * 구매 이력을 갱신한다.
 * @param {Object|null} history - 이력 객체 (이름 → 누적 금액)
 * @param {string} itemName - 항목 이름
 * @param {number} totalAmount - 해당 항목의 총 금액
 */
function updateHistory(history, itemName, totalAmount) {
  if (history) {
    if (!history[itemName]) {
      history[itemName] = 0;
    }
    history[itemName] = history[itemName] + totalAmount;
  }
}

/**
 * 단일 항목의 금액을 계산한다.
 * @param {Object} item - { name, price, qty }
 * @param {Object} strategy - PricingStrategy 인스턴스
 * @param {number} discountPercent - 할인율 (%)
 * @param {number} taxRate - 세율 (%)
 * @returns {Object} { name, price, qty, subtotal, tax, total }
 */
function calculateLineItem(item, strategy, discountPercent, taxRate) {
  const adjustedPrice = strategy.adjustPrice(item.price, item.qty);
  const subtotal = applyDiscount(adjustedPrice * item.qty, discountPercent);
  const tax = calculateTax(subtotal, taxRate);
  const total = subtotal + tax;

  return {
    name: item.name,
    price: adjustedPrice,
    qty: item.qty,
    subtotal,
    tax,
    total,
  };
}

/**
 * 주문 전체를 계산한다. (원본 calc 함수와 동일한 입출력)
 * @param {Array} items - 항목 배열 [{ name, price, qty }, ...]
 * @param {number} taxRate - 세율 (%)
 * @param {number} discountPercent - 할인율 (%)
 * @param {string} customerType - 고객 유형 ('wholesale', 'vip', 등)
 * @param {Object|null} history - 구매 이력 객체
 * @returns {Object} { items, grandTotal }
 */
function calculateOrder(items, taxRate, discountPercent, customerType, history) {
  const strategy = createPricingStrategy(customerType);
  const resultItems = [];
  let grandTotal = 0;

  for (const item of items) {
    const lineItem = calculateLineItem(item, strategy, discountPercent, taxRate);
    grandTotal += lineItem.total;
    resultItems.push(lineItem);
    updateHistory(history, item.name, lineItem.total);
  }

  grandTotal = applyBulkDiscount(grandTotal);

  return { items: resultItems, grandTotal };
}

module.exports = {
  applyDiscount,
  calculateTax,
  applyBulkDiscount,
  updateHistory,
  calculateLineItem,
  calculateOrder,
};

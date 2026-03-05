/**
 * 전략 패턴: 고객 유형별 가격 산정 전략
 */
const {
  WHOLESALE_LARGE_QUANTITY_THRESHOLD,
  WHOLESALE_LARGE_QUANTITY_DISCOUNT,
  WHOLESALE_MEDIUM_QUANTITY_THRESHOLD,
  WHOLESALE_MEDIUM_QUANTITY_DISCOUNT,
  VIP_DISCOUNT_RATE,
  CUSTOMER_TYPE,
} = require('./constants');

/**
 * 기본 가격 전략 (할인 없음)
 */
function defaultPricing(unitPrice, _quantity) {
  return unitPrice;
}

/**
 * 도매 가격 전략: 수량에 따라 단가 할인
 */
function wholesalePricing(unitPrice, quantity) {
  if (quantity > WHOLESALE_LARGE_QUANTITY_THRESHOLD) {
    return unitPrice * WHOLESALE_LARGE_QUANTITY_DISCOUNT;
  }
  if (quantity > WHOLESALE_MEDIUM_QUANTITY_THRESHOLD) {
    return unitPrice * WHOLESALE_MEDIUM_QUANTITY_DISCOUNT;
  }
  return unitPrice;
}

/**
 * VIP 가격 전략: 고정 비율 할인
 */
function vipPricing(unitPrice, _quantity) {
  return unitPrice * VIP_DISCOUNT_RATE;
}

/**
 * 고객 유형에 맞는 가격 전략을 반환
 */
function getPricingStrategy(customerType) {
  const strategies = {
    [CUSTOMER_TYPE.WHOLESALE]: wholesalePricing,
    [CUSTOMER_TYPE.VIP]: vipPricing,
  };
  return strategies[customerType] || defaultPricing;
}

module.exports = {
  defaultPricing,
  wholesalePricing,
  vipPricing,
  getPricingStrategy,
};

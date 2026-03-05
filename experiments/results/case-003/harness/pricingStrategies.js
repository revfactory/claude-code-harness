// 가격 전략 패턴 구현
const { ORDER_CONSTANTS } = require('./constants');

class PricingStrategy {
  adjustPrice(price, quantity) {
    return price;
  }
}

class WholesalePricingStrategy extends PricingStrategy {
  adjustPrice(price, quantity) {
    if (quantity > ORDER_CONSTANTS.WHOLESALE_LARGE_QTY_THRESHOLD) {
      return price * (1 - ORDER_CONSTANTS.WHOLESALE_LARGE_DISCOUNT_RATE);
    }
    if (quantity > ORDER_CONSTANTS.WHOLESALE_MEDIUM_QTY_THRESHOLD) {
      return price * (1 - ORDER_CONSTANTS.WHOLESALE_MEDIUM_DISCOUNT_RATE);
    }
    return price;
  }
}

class VipPricingStrategy extends PricingStrategy {
  adjustPrice(price, quantity) {
    return price * (1 - ORDER_CONSTANTS.VIP_DISCOUNT_RATE);
  }
}

function createPricingStrategy(type) {
  const strategies = {
    wholesale: WholesalePricingStrategy,
    vip: VipPricingStrategy,
  };
  const StrategyClass = strategies[type] || PricingStrategy;
  return new StrategyClass();
}

module.exports = {
  PricingStrategy,
  WholesalePricingStrategy,
  VipPricingStrategy,
  createPricingStrategy,
};

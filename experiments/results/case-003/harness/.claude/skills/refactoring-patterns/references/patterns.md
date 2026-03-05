# Refactoring Patterns - Code Patterns

## GoF 전략 패턴 구현

```javascript
// constants.js
const CONSTANTS = {
  WHOLESALE_LARGE_QTY_THRESHOLD: 100,
  WHOLESALE_LARGE_DISCOUNT: 0.20,
  WHOLESALE_SMALL_DISCOUNT: 0.10,
  VIP_DISCOUNT: 0.15,
  VIP_EXTRA_THRESHOLD: 50,
  VIP_EXTRA_DISCOUNT: 0.05,
  BULK_THRESHOLD: 1000,
  BULK_DISCOUNT: 0.05,
};

// pricingStrategies.js
class PricingStrategy {
  adjustPrice(price, quantity) {
    return price;
  }
}

class WholesalePricingStrategy extends PricingStrategy {
  adjustPrice(price, quantity) {
    if (quantity > CONSTANTS.WHOLESALE_LARGE_QTY_THRESHOLD) {
      return price * (1 - CONSTANTS.WHOLESALE_LARGE_DISCOUNT);
    }
    return price * (1 - CONSTANTS.WHOLESALE_SMALL_DISCOUNT);
  }
}

class VipPricingStrategy extends PricingStrategy {
  adjustPrice(price, quantity) {
    let adjusted = price * (1 - CONSTANTS.VIP_DISCOUNT);
    if (quantity > CONSTANTS.VIP_EXTRA_THRESHOLD) {
      adjusted *= (1 - CONSTANTS.VIP_EXTRA_DISCOUNT);
    }
    return adjusted;
  }
}

// 팩토리
function createPricingStrategy(type) {
  const strategies = {
    wholesale: WholesalePricingStrategy,
    vip: VipPricingStrategy,
  };
  return new (strategies[type] || PricingStrategy)();
}
```

## 경계값 테스트 패턴

```javascript
describe('boundary values', () => {
  test.each([
    { qty: 50, desc: 'at VIP extra threshold' },
    { qty: 51, desc: 'above VIP extra threshold' },
    { qty: 100, desc: 'at wholesale large threshold' },
    { qty: 101, desc: 'above wholesale large threshold' },
  ])('$desc (qty=$qty)', ({ qty }) => {
    const original = calculateOriginal(items(qty), taxRate, discount, type, {});
    const refactored = calculateOrder(items(qty), taxRate, discount, type, {});
    expect(refactored.grandTotal).toBeCloseTo(original.grandTotal, 2);
  });
});
```

## assertClose 유틸리티

부동소수점 비교를 위한 커스텀 assertion:

```javascript
function assertClose(actual, expected, precision = 2) {
  expect(actual).toBeCloseTo(expected, precision);
}

// 사용
assertClose(refactored.grandTotal, original.grandTotal);
assertClose(refactored.tax, original.tax);
```

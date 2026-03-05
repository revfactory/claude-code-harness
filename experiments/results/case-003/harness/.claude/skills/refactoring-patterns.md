# Refactoring Patterns Skill

코드 리팩토링 패턴 가이드

## Trigger Conditions
- 코드 리팩토링 요청 시
- 스파게티 코드 개선 시

## Instructions

### 전략 패턴 적용 가이드
조건 분기(if/else, switch)가 타입에 따라 다른 동작을 하는 경우:

```javascript
// 상수 정의
const CONSTANTS = {
  WHOLESALE_LARGE_QTY_THRESHOLD: 100,
  WHOLESALE_LARGE_DISCOUNT: 0.20,
  // ...
};

// 전략 클래스
class PricingStrategy {
  adjustPrice(price, quantity) { return price; }
}

class WholesalePricingStrategy extends PricingStrategy {
  adjustPrice(price, quantity) {
    if (quantity > CONSTANTS.WHOLESALE_LARGE_QTY_THRESHOLD) {
      return price * (1 - CONSTANTS.WHOLESALE_LARGE_DISCOUNT);
    }
    // ...
  }
}

// 팩토리
function createPricingStrategy(type) {
  const strategies = { wholesale: WholesalePricingStrategy, vip: VipPricingStrategy };
  return new (strategies[type] || PricingStrategy)();
}
```

### SRP 함수 분리 가이드
하나의 큰 함수를 아래처럼 분리:
- calculateLineItem(item, strategy, discountPercent, taxRate) - 단일 항목 계산
- applyDiscount(amount, discountPercent) - 할인 적용
- calculateTax(amount, taxRate) - 세금 계산
- applyBulkDiscount(grandTotal, threshold, rate) - 대량 할인
- updateHistory(history, name, amount) - 이력 갱신
- calculateOrder(items, taxRate, discountPercent, type, history) - 오케스트레이터

### 테스트 전략
- 원본 vs 리팩토링 동일성 테스트 (동일 입력 → 동일 출력)
- 각 전략별 단위 테스트
- 경계값 테스트 (수량 50, 51, 100, 101)
- 엣지 케이스 (빈 배열, 할인 0%, 세금 0%)

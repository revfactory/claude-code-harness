# Microservice Patterns Skill

이벤트 드리븐 마이크로서비스 아키텍처 패턴 가이드

## Trigger Conditions
- 마이크로서비스, 이벤트 버스, SAGA 패턴 구현 시

## Instructions

### EventBus 구현 패턴
```javascript
class EventBus {
  constructor() {
    this.handlers = new Map();      // event → Set<handler>
    this.wildcardHandlers = new Map(); // pattern → Set<handler>
  }

  subscribe(event, handler) { /* 정확한 이벤트 매칭 */ }
  subscribePattern(pattern, handler) { /* 와일드카드: 'order.*' */ }
  subscribeOnce(event, handler) { /* 일회성 구독 */ }

  async publish(event, data) {
    // 1. 정확한 매칭 핸들러 실행
    // 2. 와일드카드 매칭 핸들러 실행
    // 3. 비동기 핸들러는 Promise.allSettled로 처리
    // 4. 핸들러 에러가 다른 핸들러에 영향 주지 않도록 격리
  }

  unsubscribe(event, handler) { }
}
```

### SAGA Orchestrator 패턴
```javascript
class SagaOrchestrator {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.sagas = new Map(); // correlationId → SagaState
  }

  async executeSaga(sagaDefinition, context) {
    const correlationId = generateId();
    const state = { steps: [], compensations: [], status: 'running' };

    for (const step of sagaDefinition.steps) {
      try {
        // 타임아웃 적용
        const result = await Promise.race([
          this.executeStep(step, context, correlationId),
          this.timeout(step.timeoutMs || 5000)
        ]);
        state.steps.push({ step: step.name, status: 'completed', result });
        state.compensations.unshift(step.compensation); // 역순 보상
      } catch (error) {
        // 보상 트랜잭션 실행 (역순)
        for (const comp of state.compensations) {
          await this.executeCompensation(comp, context, correlationId);
        }
        state.status = 'compensated';
        return state;
      }
    }
    state.status = 'completed';
    return state;
  }
}
```

### 낙관적 잠금 (Inventory)
```javascript
class InventoryService {
  constructor() {
    this.inventory = new Map(); // productId → { quantity, version }
  }

  reserve(productId, quantity) {
    const item = this.inventory.get(productId);
    const currentVersion = item.version;
    if (item.quantity < quantity) throw new InsufficientStockError();
    // 낙관적 잠금: 버전 체크
    if (item.version !== currentVersion) throw new ConcurrencyError();
    item.quantity -= quantity;
    item.version++;
    return { reserved: quantity, version: item.version };
  }
}
```

### 멱등성 (Payment)
```javascript
class PaymentService {
  constructor() {
    this.payments = new Map();       // paymentId → Payment
    this.processedOrders = new Set(); // orderId 중복 방지
  }

  async charge(orderId, amount) {
    if (this.processedOrders.has(orderId)) {
      return this.payments.get(orderId); // 기존 결과 반환
    }
    // 결제 처리...
    this.processedOrders.add(orderId);
  }
}
```

### 테스트 시나리오 (5개 필수)
1. **정상 플로우**: 주문→재고예약→결제→확정, 모든 서비스 상태 검증
2. **재고 부족**: 주문→재고실패→취소, 주문 상태 CANCELLED
3. **결제 실패**: 주문→재고예약→결제실패→재고해제→취소, 재고 원복 확인
4. **동시 주문**: 2개 주문이 동시에 같은 상품 주문, 하나만 성공
5. **타임아웃**: SAGA 단계가 시간 초과 시 보상 트랜잭션

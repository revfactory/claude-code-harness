# SAGA Pattern 참조

## SAGA Orchestrator 코드

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

## 낙관적 잠금 (Inventory)

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

## 멱등성 (Payment)

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

## 보상 트랜잭션

보상은 실행된 단계의 역순으로 수행:
- `compensations.unshift(step.compensation)` -- 스택처럼 역순 저장
- 실패 시 `state.compensations` 순회하며 각 보상 실행
- 각 보상은 독립적으로 실행 (한 보상의 실패가 다른 보상에 영향 주지 않도록)

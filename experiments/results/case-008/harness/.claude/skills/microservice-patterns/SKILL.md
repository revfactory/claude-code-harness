---
name: microservice-patterns
description: "Event-driven microservice architecture patterns guide. Use when the user requests implementing microservices, event bus, SAGA pattern, orchestration, compensating transactions, or distributed system coordination."
---

# Microservice Patterns Skill

이벤트 드리븐 마이크로서비스 아키텍처 패턴 가이드

## 서비스 아키텍처

```
          EventBus (pub/sub)
         /    |    \      \
OrderService  InventoryService  PaymentService  NotificationService
    |              |                  |                |
  orders[]     inventory{}        payments[]      notifications[]
         \       |        /
       SAGA Orchestrator
    (주문 생성 플로우 조율)
```

### 핵심 규칙
- 서비스 간 직접 참조 금지 (이벤트로만 통신)
- 각 서비스는 자체 상태만 관리
- correlation ID로 이벤트 흐름 추적
- 타임아웃: SAGA 단계별 5초 제한

## SAGA 플로우

```
정상: order.created → inventory.reserved → payment.completed → order.confirmed
재고실패: order.created → inventory.failed → order.cancelled
결제실패: order.created → inventory.reserved → payment.failed → inventory.released → order.cancelled
```

보상 트랜잭션은 실행된 단계의 역순으로 수행.

## 이벤트 네이밍 규칙

- `order.created`, `order.confirmed`, `order.cancelled`
- `inventory.reserved`, `inventory.released`, `inventory.failed`
- `payment.completed`, `payment.failed`, `payment.refunded`
- `notification.sent`

## 파일 구조

```
src/
  event-bus.js           - 이벤트 버스 (pub/sub, 와일드카드, 비동기)
  saga-orchestrator.js   - SAGA 패턴 오케스트레이터
  services/
    order-service.js     - 주문 CRUD + 상태 관리
    inventory-service.js - 재고 관리 (reserve/release/deduct, 낙관적 잠금)
    payment-service.js   - 결제 처리 (charge/refund, 멱등성)
    notification-service.js - 알림 이력
  utils/
    correlation-id.js    - 상관관계 ID 생성
    logger.js            - 이벤트 추적 로거
tests/
  event-bus.test.js
  saga.test.js
  integration.test.js    - 5개 시나리오 통합 테스트
```

## 테스트 시나리오 (5개 필수)

1. **정상 플로우**: 주문→재고예약→결제→확정, 모든 서비스 상태 검증
2. **재고 부족**: 주문→재고실패→취소, 주문 상태 CANCELLED
3. **결제 실패**: 주문→재고예약→결제실패→재고해제→취소, 재고 원복 확인
4. **동시 주문**: 2개 주문이 동시에 같은 상품 주문, 하나만 성공
5. **타임아웃**: SAGA 단계가 시간 초과 시 보상 트랜잭션

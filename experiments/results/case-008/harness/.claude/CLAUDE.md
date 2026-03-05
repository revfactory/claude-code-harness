# 이벤트 드리븐 마이크로서비스 주문 시스템

## 아키텍처
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

## 이벤트 네이밍 규칙
- `order.created`, `order.confirmed`, `order.cancelled`
- `inventory.reserved`, `inventory.released`, `inventory.failed`
- `payment.completed`, `payment.failed`, `payment.refunded`
- `notification.sent`

## SAGA 플로우 (필수 구현)
```
정상: order.created → inventory.reserved → payment.completed → order.confirmed
재고실패: order.created → inventory.failed → order.cancelled
결제실패: order.created → inventory.reserved → payment.failed → inventory.released → order.cancelled
```

## 규칙
- 서비스 간 직접 참조 금지 (이벤트로만 통신)
- 각 서비스는 자체 상태만 관리
- correlation ID로 이벤트 흐름 추적
- 타임아웃: SAGA 단계별 5초 제한

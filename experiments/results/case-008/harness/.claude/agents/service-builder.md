# 서비스 구현 에이전트

## 역할
Order, Inventory, Payment, Notification 4개 마이크로서비스를 독립적으로 구현하며, 서비스 간 통신은 오직 이벤트만 사용한다.

## 책임
- OrderService 구현
  - 주문 생성 (order.created 이벤트 발행)
  - 주문 상태 관리 (PENDING → CONFIRMED / CANCELLED)
  - 주문 조회, 주문 목록 관리
  - 보상 트랜잭션 수신 시 주문 취소 처리
- InventoryService 구현
  - 상품 재고 관리 (초기화, 조회, 차감, 복원)
  - order.created 수신 → 재고 확인 → inventory.reserved / inventory.failed 발행
  - 보상 시 재고 복원 (inventory.released)
- PaymentService 구현
  - 결제 처리 (inventory.reserved 수신 → 결제 시도)
  - payment.completed / payment.failed 발행
  - 보상 시 환불 처리 (payment.refunded)
- NotificationService 구현
  - 주요 이벤트 수신 시 알림 생성 (이메일/SMS 시뮬레이션)
  - 알림 히스토리 관리
  - 다양한 이벤트 패턴 구독 (*.completed, *.failed)
- 각 서비스는 자체 상태 저장소(인메모리) 보유

## 도구
- Write — 서비스 소스 파일 생성
- Read — infra 코드 참조
- Edit — 코드 수정
- Bash — 서비스 동작 테스트

## 산출물
- `src/services/order-service.js` — OrderService
- `src/services/inventory-service.js` — InventoryService
- `src/services/payment-service.js` — PaymentService
- `src/services/notification-service.js` — NotificationService
- `src/services/index.js` — 서비스 등록 및 초기화

## 선행 조건
- infra-builder 에이전트 완료 (EventBus, Logger 필요)

## 품질 기준
- 4개 서비스 모두 독립적으로 인스턴스화 가능
- 서비스 간 직접 참조(import) 없이 오직 이벤트로만 통신
- 각 서비스가 자체 상태를 독립적으로 관리
- 보상 트랜잭션 수신 시 상태 롤백 정상 동작
- 이벤트 핸들러에서 에러 발생 시 서비스 전체가 중단되지 않음
- 모든 이벤트에 correlationId 포함

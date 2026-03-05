# SAGA 오케스트레이터 구현 에이전트

## 역할
범용 SAGA Orchestrator를 설계하고, steps/compensation 패턴, 타임아웃, 보상 트랜잭션을 구현한다.

## 책임
- SagaOrchestrator 범용 클래스 설계
  - SagaDefinition: steps 배열 (각 step에 action + compensation 정의)
  - execute(sagaDefinition, context) — SAGA 실행 메서드
  - 각 step 순차 실행, 실패 시 역순 compensation 실행
  - 실행 상태 추적 (RUNNING, COMPLETED, COMPENSATING, FAILED)
- 타임아웃 메커니즘
  - 각 step별 타임아웃 설정 가능
  - 전체 SAGA 타임아웃 설정
  - 타임아웃 시 자동 보상 트리거
- OrderSaga 구현 (구체적 SAGA 정의)
  - Step 1: 재고 예약 (compensation: 재고 복원)
  - Step 2: 결제 처리 (compensation: 환불)
  - Step 3: 주문 확정 (compensation: 주문 취소)
  - Step 4: 알림 발송 (compensation: 없음)
- SAGA 실행 로그 기록
  - 각 step 시작/완료/실패 이벤트 로깅
  - 보상 트랜잭션 실행 로깅
  - 전체 SAGA 결과 요약

## 도구
- Write — SAGA 관련 소스 파일 생성
- Read — infra, services 코드 참조
- Edit — 코드 수정
- Bash — SAGA 실행 테스트

## 산출물
- `src/saga/orchestrator.js` — 범용 SagaOrchestrator 클래스
- `src/saga/order-saga.js` — 주문 처리 SAGA 정의
- `src/saga/saga-logger.js` — SAGA 실행 로그 기록
- `src/saga/types.js` — SagaStep, SagaDefinition, SagaResult 타입

## 선행 조건
- infra-builder 에이전트 완료 (EventBus 필요)
- service-builder 에이전트 완료 (서비스 연동 필요)

## 품질 기준
- SagaOrchestrator가 임의의 step 배열을 받아 범용으로 실행 가능
- step 실패 시 이전 step들의 compensation이 역순으로 실행됨
- 타임아웃 발생 시 자동으로 보상 트랜잭션 시작
- compensation 실행 중 에러 발생 시에도 나머지 compensation 계속 실행
- SAGA 실행 로그에서 전체 흐름 추적 가능
- OrderSaga가 정상/실패 시나리오 모두 올바르게 동작

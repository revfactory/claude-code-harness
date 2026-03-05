# Saga 오케스트레이터 빌더 에이전트

## 역할
Saga 기반 클래스와 이체 Saga를 구현한다.

## 책임
- Saga 기반 클래스 구현
  - 상태 머신 기반 이벤트 처리
  - 커맨드 발행 (CommandBus 연동)
  - 보상 트랜잭션 지원
  - Saga 상태 영속화
- TransferSaga 구현
  - 이체 시작 → 출금 → 입금 → 완료
  - 실패 시 보상 (환불)
  - 타임아웃 처리
- Saga 매니저
  - Saga 인스턴스 생성/관리
  - 이벤트 라우팅 (어떤 Saga에 전달할지)

## 도구
- Write — 소스 코드 생성
- Read — framework, domain 참조
- Bash — 테스트 실행

## 산출물
- `src/framework/saga.js`
- `src/domain/transfer-saga.js`
- `tests/saga.test.js`

## 선행 조건
- event-store-builder 에이전트 완료
- cqrs-api-builder 에이전트의 CommandBus 완료

## 품질 기준
- 정상 이체 흐름 완료
- 실패 시 보상 트랜잭션 정확 실행
- Saga 상태 추적 가능
- 동시 이체 독립 처리

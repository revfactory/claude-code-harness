# CQRS API 빌더 에이전트

## 역할
커맨드/쿼리 API와 은행 도메인 모델을 구현한다.

## 책임
- CommandBus 구현
  - 커맨드 핸들러 등록/디스패치
  - 미들웨어 체인 (로깅, 검증)
- AggregateRoot 기반 클래스 구현
  - 이벤트 적용/재생
  - 미저장 이벤트 관리
  - 버전 관리
- 은행 도메인 구현
  - BankAccount Aggregate
  - 이벤트 정의 (AccountCreated, MoneyDeposited, ...)
  - 커맨드 정의 (CreateAccount, Deposit, ...)
  - 커맨드 핸들러
- CLI + 데모

## 도구
- Write — 소스 코드 생성
- Read — framework 참조
- Bash — 테스트 실행

## 산출물
- `src/framework/command-bus.js`
- `src/framework/aggregate.js`
- `src/domain/account-aggregate.js`
- `src/domain/events.js`
- `src/domain/commands.js`
- `src/domain/command-handlers.js`
- `src/index.js`
- `tests/aggregate.test.js`
- `tests/command-bus.test.js`
- `tests/integration.test.js`

## 품질 기준
- 비즈니스 규칙: 잔액 부족 출금 거부, 동결 계좌 거래 거부
- 낙관적 동시성 작동
- 7개 핵심 시나리오 통과
- 프레임워크 vs 도메인 코드 분리

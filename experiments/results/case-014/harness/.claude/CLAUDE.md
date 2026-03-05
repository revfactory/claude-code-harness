# 이벤트 소싱 CQRS 프레임워크

## 아키텍처
```
[Client] → [CommandBus] → [CommandHandler]
                              ↓
                        [Aggregate.apply()]
                              ↓
                        [EventStore.append()]
                              ↓
                        [EventBus.publish()]
                         ↓            ↓
                   [Projection]   [Saga]
                         ↓            ↓
                   [ReadModel]   [CommandBus] (보상)
```

## 파일 구조
```
src/
  framework/
    event-store.js        - 이벤트 스토어 (append-only, 버전 관리)
    aggregate.js          - 애그리게이트 루트 기반 클래스
    command-bus.js        - 커맨드 버스 (등록 + 디스패치)
    event-bus.js          - 이벤트 버스 (구독 + 발행)
    projection.js         - 프로젝션 기반 클래스
    snapshot-store.js     - 스냅샷 저장소
    saga.js               - Saga 기반 클래스
    repository.js         - 애그리게이트 리포지토리 (스토어 + 스냅샷 통합)
  domain/
    account-aggregate.js  - 은행 계좌 애그리게이트
    events.js             - 이벤트 정의
    commands.js           - 커맨드 정의
    command-handlers.js   - 커맨드 핸들러
    transfer-saga.js      - 이체 Saga
  projections/
    account-balance.js    - 계좌 잔액 프로젝션
    transaction-history.js - 거래 내역 프로젝션
    transfer-status.js    - 이체 상태 프로젝션
  index.js                - CLI + 데모
tests/
  event-store.test.js
  aggregate.test.js
  command-bus.test.js
  projection.test.js
  saga.test.js
  snapshot.test.js
  integration.test.js
```

## 핵심 규칙
- 이벤트는 불변: 한 번 저장되면 수정/삭제 불가
- 애그리게이트 경계 내에서만 일관성 보장
- 낙관적 동시성: expectedVersion 불일치 시 ConcurrencyError
- Saga 실패 시 반드시 보상 트랜잭션 실행
- 프레임워크 코드와 도메인 코드 엄격 분리
- 프로젝션은 언제든 삭제 후 재구축 가능

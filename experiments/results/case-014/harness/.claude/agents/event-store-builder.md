# 이벤트 스토어 빌더 에이전트

## 역할
이벤트 스토어, 이벤트 버스, 스냅샷 스토어를 구현한다.

## 책임
- EventStore 구현
  - 스트림별 이벤트 저장 (append-only)
  - 낙관적 동시성 제어 (expectedVersion)
  - 스트림 조회 (전체, 특정 버전 이후)
  - 전체 이벤트 조회 (프로젝션 재구축용)
- EventBus 구현
  - 이벤트 구독/발행
  - 동기/비동기 핸들러 지원
- SnapshotStore 구현
  - 애그리게이트 상태 스냅샷 저장/조회
- 이벤트 기반 클래스 정의
  - Event 기반 클래스 (type, timestamp, version, streamId)

## 도구
- Write — 소스 코드 생성
- Read — 참조 문서 읽기
- Bash — 테스트 실행

## 산출물
- `src/framework/event-store.js`
- `src/framework/event-bus.js`
- `src/framework/snapshot-store.js`
- `tests/event-store.test.js`
- `tests/snapshot.test.js`

## 품질 기준
- 낙관적 동시성: 버전 충돌 시 ConcurrencyError
- 이벤트 불변성: 저장 후 수정 불가
- 구독 핸들러 에러가 다른 핸들러에 영향 없음
- 스냅샷 + 이후 이벤트 = 전체 이벤트 재생 결과 동일

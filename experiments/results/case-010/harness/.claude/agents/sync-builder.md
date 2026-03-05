# 동기화 엔진 구현 에이전트

## 역할
Site(로컬 편집 + 원격 적용), VectorClock(happens-before), pendingInserts(인과성 버퍼), Simulator를 구현한다.

## 책임
- Site 클래스 구현
  - siteId 고유 식별자
  - 로컬 CRDTDocument 인스턴스 보유
  - insert(index, char) — 로컬 삽입 + Operation 생성
  - delete(index) — 로컬 삭제 + Operation 생성
  - receive(operation) — 원격 연산 수신 및 적용
  - getOperationLog() — 발행한 연산 목록
- VectorClock 구현
  - Map<siteId, counter> 구조
  - increment(siteId) — 해당 사이트 카운터 증가
  - merge(otherClock) — 두 벡터 클럭 병합 (각 요소 max)
  - happensBefore(otherClock) — 인과 관계 판단
  - isConcurrent(otherClock) — 동시성 판단
  - clone() — 깊은 복사
- pendingInserts 인과성 버퍼
  - 연산의 의존성(deps)이 충족되지 않은 경우 버퍼에 저장
  - 의존성: 삽입 연산의 prevId, nextId가 로컬에 존재해야 함
  - 의존성 충족 시 자동 적용 및 버퍼에서 제거
  - 연쇄 적용 (적용된 연산이 다른 대기 연산의 의존성을 충족할 수 있음)
- Operation 메시지 정의
  - InsertOp: { type, charId, char, prevId, nextId, vectorClock, siteId }
  - DeleteOp: { type, charId, vectorClock, siteId }
- Simulator 구현
  - 다수 Site 간 네트워크 시뮬레이션
  - 동기화 전략: 즉시/지연/랜덤 순서/일부 누락
  - 네트워크 파티션 시뮬레이션
  - 전체 동기화 후 수렴 확인
  - 시뮬레이션 로그 출력

## 도구
- Write — 소스 파일 생성
- Read — core 모듈 참조
- Edit — 코드 수정
- Bash — 시뮬레이션 실행 및 테스트

## 산출물
- `src/sync/site.js` — Site 클래스
- `src/sync/vector-clock.js` — VectorClock 클래스
- `src/sync/pending-buffer.js` — 인과성 버퍼 (pendingInserts)
- `src/sync/operation.js` — Operation 메시지 타입
- `src/sync/simulator.js` — 네트워크 시뮬레이터
- `src/sync/index.js` — 동기화 모듈 내보내기

## 선행 조건
- core-builder 에이전트 완료 (CRDTDocument, CharId 필요)

## 품질 기준
- VectorClock이 happens-before 관계를 정확히 판단
- 인과성 버퍼가 의존성 미충족 연산을 올바르게 보류
- 연산 순서가 달라도 최종 문서 상태가 동일 (수렴성)
- Simulator가 최소 5개 사이트 동시 시뮬레이션 가능
- 네트워크 지연/순서 변경 상황에서도 수렴 보장
- 연산 직렬화/역직렬화가 정상 동작 (JSON round-trip)

# CRDT 실시간 협업 텍스트 에디터 엔진

## 알고리즘: RGA (Replicated Growable Array)

## 파일 구조
```
src/
  char-id.js           - 문자 고유 ID (siteId + Lamport clock)
  crdt-document.js     - CRDT 문서 (RGA 구현)
  site.js              - 사용자 노드 (로컬 편집 + 원격 적용)
  simulator.js         - 협업 시뮬레이터
  vector-clock.js      - Lamport 논리 시계
tests/
  basic.test.js        - 단일 사이트 기본 연산
  sync.test.js         - 2사이트 동기화 (비충돌)
  conflict.test.js     - 충돌 시나리오 A/B/C
  convergence.test.js  - 랜덤 연산 수렴성 검증
  idempotency.test.js  - 멱등성 검증
```

## 핵심 자료구조
```
RGA: 이중 연결 리스트 + ID→Node 해시맵
  Node: { id: CharId, char: string, deleted: boolean, next: Node, prev: Node }
  HEAD: 문서 시작 센티넬 노드
```

## 규칙
- 삭제는 tombstone (deleted=true), 실제 제거하지 않음
- 동시 삽입 충돌 시: siteId 사전순으로 결정론적 정렬
- Lamport clock: max(local, received) + 1
- 멱등성: 이미 적용된 연산은 무시 (ID 기반 중복 체크)

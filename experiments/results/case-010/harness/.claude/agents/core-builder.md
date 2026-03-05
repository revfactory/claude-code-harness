# CRDT 코어 구현 에이전트

## 역할
CharId(비교/정렬), CRDTDocument(이중 연결 리스트 + nodeMap), _integrateInsert(충돌 해결) 핵심 자료구조를 구현한다.

## 책임
- CharId 클래스 구현
  - siteId (사이트 식별자) + counter (단조 증가 카운터) 쌍
  - 전순서(total order) 비교: counter 우선, 동일 시 siteId 비교
  - 동등성 검사 (equals)
  - 직렬화/역직렬화 (JSON 변환)
- CRDTDocument 클래스 구현
  - 이중 연결 리스트 기반 문자 저장
    - Node: { id: CharId, char: string, isDeleted: boolean, prev: Node, next: Node }
    - head/tail 센티널 노드 (경계 표시)
  - nodeMap (Map<string, Node>) — CharId → Node 빠른 조회
  - localInsert(index, char, siteId) — 사용자 로컬 삽입
    - 가시적(비삭제) 인덱스를 실제 노드 위치로 변환
    - 새 CharId 생성, 노드 삽입, 연결 리스트 갱신
  - localDelete(index) — 사용자 로컬 삭제 (tombstone 방식)
  - remoteInsert(charId, char, prevId, nextId) — 원격 삽입 수신
  - remoteDelete(charId) — 원격 삭제 수신
  - getText() — 현재 가시적 문자열 반환
  - length — 가시적 문자 수
- _integrateInsert 충돌 해결 알고리즘
  - 동일 위치(prev, next 사이)에 다중 삽입 시 정렬 규칙 적용
  - CharId 기반 결정론적 순서 (모든 사이트에서 동일 결과)
  - Fugue/YATA 스타일 통합 전략

## 도구
- Write — 소스 파일 생성
- Read — 기존 코드 참조
- Edit — 코드 수정
- Bash — 단위 테스트 실행

## 산출물
- `src/core/char-id.js` — CharId 클래스
- `src/core/node.js` — Node 클래스 (이중 연결 리스트 노드)
- `src/core/crdt-document.js` — CRDTDocument 클래스
- `src/core/index.js` — 코어 모듈 내보내기

## 선행 조건
없음 (독립 실행 가능)

## 품질 기준
- CharId 비교가 전순서(total order) 보장 — 모든 쌍에 대해 결정론적 결과
- 이중 연결 리스트의 삽입/삭제가 O(1) (위치 탐색 제외)
- nodeMap을 통한 CharId → Node 조회가 O(1)
- tombstone 삭제 방식으로 삭제된 노드 정보 유지
- _integrateInsert가 동시 삽입 충돌을 결정론적으로 해결
- getText()가 삭제된 노드를 제외한 올바른 문자열 반환

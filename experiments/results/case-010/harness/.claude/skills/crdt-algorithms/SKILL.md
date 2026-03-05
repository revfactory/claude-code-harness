---
name: crdt-algorithms
description: "CRDT-based real-time collaborative text editor implementation guide. Use when the user requests implementing CRDTs, real-time collaboration, conflict resolution, RGA algorithm, or convergent replicated data types."
---

# CRDT Algorithms Skill

CRDT 기반 실시간 협업 텍스트 에디터 구현 가이드

## RGA 자료구조 개요

```
RGA: 연결 리스트 + ID→Node 해시맵
  Node: { id: CharId, char: string, deleted: boolean, next: Node }
  HEAD: 문서 시작 센티넬 노드
```

- CharId: `(siteId, Lamport clock)` 쌍으로 전역 고유 식별
- 삭제는 tombstone (`deleted=true`), 실제 제거하지 않음
- `nodeMap`으로 O(1) 노드 조회

## 충돌 해결 규칙 (결정론적)

1. **동시 삽입 (같은 위치)**: `id.compareTo()`로 결정. clock 우선, 같으면 siteId 사전순
2. **삽입 vs 삭제**: tombstone 기반이므로 삭제된 노드 뒤에 삽입 가능
3. **멱등성**: `nodeMap`에 이미 존재하면 무시 (ID 기반 중복 체크)

## 인과성 원칙

- Lamport clock: `max(local, received) + 1`
- happens-before 관계 보장
- 모든 사이트가 동일 연산 집합을 적용하면 동일 결과 수렴

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

## 테스트 전략 (6가지)

1. 단일 사이트: 삽입/삭제/getText
2. 2사이트 비충돌 동기화
3. 시나리오 A: 동시 삽입 같은 위치 → 결정론적 순서
4. 시나리오 B: 삽입 vs 삭제 같은 위치
5. 시나리오 C: 3사이트 복합 편집 → 수렴
6. 랜덤 퍼즈 테스트: N회 랜덤 연산 → syncAll → 수렴 검증

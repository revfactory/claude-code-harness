# CRDT Algorithms Skill

CRDT 기반 실시간 협업 텍스트 에디터 구현 가이드

## Trigger Conditions
- CRDT, 실시간 협업, 충돌 해결 구현 시

## Instructions

### CharId (문자 고유 ID)
```javascript
class CharId {
  constructor(siteId, clock) {
    this.siteId = siteId;
    this.clock = clock;   // Lamport 논리 시계
  }
  // 비교: clock 우선, 같으면 siteId 사전순
  compareTo(other) {
    if (this.clock !== other.clock) return this.clock - other.clock;
    return this.siteId < other.siteId ? -1 : this.siteId > other.siteId ? 1 : 0;
  }
  equals(other) {
    return this.siteId === other.siteId && this.clock === other.clock;
  }
  toString() { return `${this.siteId}:${this.clock}`; }
}
```

### RGA Document 구현
```javascript
class CRDTDocument {
  constructor(siteId) {
    this.siteId = siteId;
    this.clock = 0;
    // HEAD 센티넬: 문서 시작점
    this.head = { id: new CharId('', 0), char: '', deleted: false, next: null };
    this.nodeMap = new Map(); // id.toString() → Node (빠른 조회)
    this.nodeMap.set(this.head.id.toString(), this.head);
  }

  // 로컬 삽입: position(가시적 인덱스) → 연산 생성
  localInsert(position, char) {
    this.clock++;
    const id = new CharId(this.siteId, this.clock);
    const parentNode = this._findVisibleNodeAt(position - 1); // -1은 HEAD
    this._integrateInsert(id, parentNode.id, char);
    return { type: 'insert', id, parentId: parentNode.id, char };
  }

  // 로컬 삭제: position → tombstone
  localDelete(position) {
    const node = this._findVisibleNodeAt(position);
    node.deleted = true;
    return { type: 'delete', id: node.id };
  }

  // 원격 연산 적용
  applyRemote(op) {
    this.clock = Math.max(this.clock, op.id.clock) + 1;
    if (op.type === 'insert') {
      // 멱등성: 이미 존재하면 무시
      if (this.nodeMap.has(op.id.toString())) return;
      this._integrateInsert(op.id, op.parentId, op.char);
    } else if (op.type === 'delete') {
      const node = this.nodeMap.get(op.id.toString());
      if (node) node.deleted = true;
    }
  }

  // 핵심: 삽입 통합 (충돌 해결)
  _integrateInsert(id, parentId, char) {
    const parentNode = this.nodeMap.get(parentId.toString());
    const newNode = { id, char, deleted: false, next: null };

    // 삽입 위치 결정: parentNode 다음에서 시작
    // 동시 삽입 충돌 시: id가 더 큰 것(siteId 사전순 뒤)이 앞에 위치
    let current = parentNode.next;
    while (current !== null && current.id.compareTo(id) > 0) {
      // current가 id보다 크면 (= 나중에 삽입된 것) 뒤로 이동
      current = current.next;
    }

    // parentNode와 current 사이에 삽입
    newNode.next = current;
    // ... (이중 연결 리스트 삽입)

    this.nodeMap.set(id.toString(), newNode);
  }

  // 가시적 노드 인덱스 탐색 (deleted=false인 것만 카운트)
  _findVisibleNodeAt(position) {
    if (position === -1) return this.head;
    let current = this.head.next;
    let visibleIndex = 0;
    while (current) {
      if (!current.deleted) {
        if (visibleIndex === position) return current;
        visibleIndex++;
      }
      current = current.next;
    }
    throw new Error(`Position ${position} out of range`);
  }

  getText() {
    let result = '';
    let current = this.head.next;
    while (current) {
      if (!current.deleted) result += current.char;
      current = current.next;
    }
    return result;
  }
}
```

### Site 구현
```javascript
class Site {
  constructor(siteId) {
    this.doc = new CRDTDocument(siteId);
    this.pendingOps = [];  // 미전송 연산 큐
  }

  insert(position, char) {
    const op = this.doc.localInsert(position, char);
    this.pendingOps.push(op);
    return op;
  }

  delete(position) {
    const op = this.doc.localDelete(position);
    this.pendingOps.push(op);
    return op;
  }

  receiveOps(ops) {
    for (const op of ops) {
      this.doc.applyRemote(op);
    }
  }

  sync(otherSite) {
    otherSite.receiveOps(this.pendingOps);
    this.receiveOps(otherSite.pendingOps);
    this.pendingOps = [];
    otherSite.pendingOps = [];
  }

  getText() { return this.doc.getText(); }
}
```

### 충돌 해결 규칙 (결정론적)
1. **동시 삽입 (같은 위치)**: `id.compareTo()` 로 결정. clock이 같으면 siteId 사전순
2. **삽입 vs 삭제**: tombstone 기반이므로 삭제된 노드 뒤에 삽입 가능
3. **멱등성**: `nodeMap`에 이미 존재하면 무시
4. **인과성**: Lamport clock으로 happens-before 보장

### 테스트 전략 (6가지)
1. 단일 사이트: 삽입/삭제/getText
2. 2사이트 비충돌 동기화
3. 시나리오 A: 동시 삽입 같은 위치 → 결정론적 순서
4. 시나리오 B: 삽입 vs 삭제 같은 위치
5. 시나리오 C: 3사이트 복합 편집 → 수렴
6. 랜덤 퍼즈 테스트: N회 랜덤 연산 → syncAll → 수렴 검증

# RGA Algorithm 참조

## CharId 클래스

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

## CRDTDocument 구현

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
      if (this.nodeMap.has(op.id.toString())) return; // 멱등성
      this._integrateInsert(op.id, op.parentId, op.char);
    } else if (op.type === 'delete') {
      const node = this.nodeMap.get(op.id.toString());
      if (node) node.deleted = true;
    }
  }
}
```

## _integrateInsert (핵심 충돌 해결)

```javascript
_integrateInsert(id, parentId, char) {
  const parentNode = this.nodeMap.get(parentId.toString());
  const newNode = { id, char, deleted: false, next: null };

  // 삽입 위치 결정: parentNode 다음에서 시작
  // 동시 삽입 충돌 시: id가 더 큰 것(siteId 사전순 뒤)이 앞에 위치
  let current = parentNode.next;
  while (current !== null && current.id.compareTo(id) > 0) {
    current = current.next;
  }

  // parentNode와 current 사이에 삽입
  newNode.next = current;
  // ... (연결 리스트 삽입)

  this.nodeMap.set(id.toString(), newNode);
}
```

## Site 클래스

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

/**
 * CRDTDocument - RGA (Replicated Growable Array) 기반 CRDT 문서
 *
 * 핵심 자료구조: 이중 연결 리스트 + ID->Node 해시맵
 * 삭제는 tombstone 방식 (deleted=true)
 * 동시 삽입 충돌: id.compareTo() 결정론적 정렬
 */
const { CharId } = require('./char-id');

class CRDTDocument {
  constructor(siteId) {
    this.siteId = siteId;
    this.clock = 0;

    // HEAD 센티넬 노드: 문서 시작점
    this.head = {
      id: new CharId('', 0),
      char: '',
      deleted: false,
      next: null,
      prev: null,
    };

    // id.toString() -> Node 빠른 조회
    this.nodeMap = new Map();
    this.nodeMap.set(this.head.id.toString(), this.head);

    // 부모 노드가 아직 없는 대기 연산 (인과성 버퍼)
    this.pendingInserts = []; // { id, parentId, char }
  }

  /**
   * 로컬 삽입: 가시적 인덱스 position에 char 삽입
   * position 0 = 문서 맨 앞에 삽입 (HEAD 다음)
   * @returns {object} 삽입 연산 (원격 전송용)
   */
  localInsert(position, char) {
    this.clock++;
    const id = new CharId(this.siteId, this.clock);
    // position 0이면 HEAD 뒤에 삽입, position N이면 N번째 가시 노드 뒤에 삽입
    const parentNode = this._findVisibleNodeAt(position - 1);
    this._integrateInsert(id, parentNode.id, char);
    return { type: 'insert', id, parentId: parentNode.id, char };
  }

  /**
   * 로컬 삭제: 가시적 인덱스 position의 문자 삭제 (tombstone)
   * @returns {object} 삭제 연산 (원격 전송용)
   */
  localDelete(position) {
    const node = this._findVisibleNodeAt(position);
    if (!node || node === this.head) {
      throw new Error(`Cannot delete at position ${position}`);
    }
    node.deleted = true;
    return { type: 'delete', id: node.id };
  }

  /**
   * 원격 연산 적용
   * Lamport clock 갱신: max(local, received) + 1
   */
  applyRemote(op) {
    this.clock = Math.max(this.clock, op.id.clock) + 1;

    if (op.type === 'insert') {
      // 멱등성: 이미 존재하면 무시
      if (this.nodeMap.has(op.id.toString())) return;
      // 인과성: 부모 노드가 아직 없으면 대기 큐에 추가
      if (!this.nodeMap.has(op.parentId.toString())) {
        this.pendingInserts.push({ id: op.id, parentId: op.parentId, char: op.char });
        return;
      }
      this._integrateInsert(op.id, op.parentId, op.char);
      // 대기 중인 연산 중 이제 적용 가능한 것들 처리
      this._flushPendingInserts();
    } else if (op.type === 'delete') {
      const node = this.nodeMap.get(op.id.toString());
      if (node) node.deleted = true;
    }
  }

  /**
   * 대기 큐에서 부모가 이제 존재하는 연산들을 재귀적으로 적용
   */
  _flushPendingInserts() {
    let progress = true;
    while (progress) {
      progress = false;
      const remaining = [];
      for (const pending of this.pendingInserts) {
        if (this.nodeMap.has(pending.id.toString())) {
          // 이미 적용됨 (멱등성)
          progress = true;
          continue;
        }
        if (this.nodeMap.has(pending.parentId.toString())) {
          this._integrateInsert(pending.id, pending.parentId, pending.char);
          progress = true;
        } else {
          remaining.push(pending);
        }
      }
      this.pendingInserts = remaining;
    }
  }

  /**
   * 핵심 알고리즘: 삽입 통합 (RGA 충돌 해결)
   *
   * parentNode 다음 위치에서 시작하여, id.compareTo()가 더 큰 노드는
   * 건너뛰고 (그 뒤에 삽입), 더 작거나 같은 노드를 만나면 그 앞에 삽입.
   *
   * 결과: 동시 삽입 시 id가 더 큰 것(siteId 사전순 뒤)이 앞에 위치
   */
  _integrateInsert(id, parentId, char) {
    const parentNode = this.nodeMap.get(parentId.toString());
    if (!parentNode) {
      throw new Error(`Parent node not found: ${parentId.toString()}`);
    }

    const newNode = { id, char, deleted: false, next: null, prev: null };

    // 삽입 위치 탐색: parentNode 바로 다음에서 시작
    let current = parentNode.next;
    let insertAfter = parentNode;

    while (current !== null && current.id.compareTo(id) > 0) {
      // current.id가 newNode.id보다 크면 current 뒤로 이동
      insertAfter = current;
      current = current.next;
    }

    // insertAfter와 current 사이에 newNode 삽입 (이중 연결 리스트)
    newNode.next = insertAfter.next;
    newNode.prev = insertAfter;
    if (insertAfter.next) {
      insertAfter.next.prev = newNode;
    }
    insertAfter.next = newNode;

    this.nodeMap.set(id.toString(), newNode);
  }

  /**
   * 가시적 노드 인덱스 탐색
   * position=-1 -> HEAD 반환
   * position=0 -> 첫 번째 가시 노드
   * deleted=false인 노드만 카운트
   */
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
    throw new Error(`Position ${position} out of range (visible count: ${visibleIndex})`);
  }

  /**
   * 현재 문서 텍스트 반환 (tombstone 제외)
   */
  getText() {
    let result = '';
    let current = this.head.next;
    while (current) {
      if (!current.deleted) result += current.char;
      current = current.next;
    }
    return result;
  }

  /**
   * 문서의 전체 노드 수 (tombstone 포함)
   */
  getNodeCount() {
    let count = 0;
    let current = this.head.next;
    while (current) {
      count++;
      current = current.next;
    }
    return count;
  }

  /**
   * 가시적 문자 수
   */
  getVisibleCount() {
    return this.getText().length;
  }

  /**
   * 디버그: 전체 노드 리스트 출력
   */
  debugNodes() {
    const nodes = [];
    let current = this.head.next;
    while (current) {
      nodes.push({
        id: current.id.toString(),
        char: current.char,
        deleted: current.deleted,
      });
      current = current.next;
    }
    return nodes;
  }
}

module.exports = { CRDTDocument };

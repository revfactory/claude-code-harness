/**
 * Site - 사용자 노드
 * 로컬 편집 + 원격 연산 적용 + 동기화 관리
 */
const { CRDTDocument } = require('./crdt-document');

class Site {
  constructor(siteId) {
    this.siteId = siteId;
    this.doc = new CRDTDocument(siteId);
    this.pendingOps = []; // 미전송 연산 큐
    this.appliedOps = new Set(); // 적용된 연산 키 (type:id, 멱등성 보장)
  }

  /**
   * 로컬 삽입
   */
  insert(position, char) {
    const op = this.doc.localInsert(position, char);
    this.pendingOps.push(op);
    this.appliedOps.add(`${op.type}:${op.id.toString()}`);
    return op;
  }

  /**
   * 로컬 삭제
   */
  delete(position) {
    const op = this.doc.localDelete(position);
    this.pendingOps.push(op);
    this.appliedOps.add(`${op.type}:${op.id.toString()}`);
    return op;
  }

  /**
   * 원격 연산 수신 및 적용
   */
  receiveOps(ops) {
    for (const op of ops) {
      const opKey = `${op.type}:${op.id.toString()}`;
      if (this.appliedOps.has(opKey)) continue; // 멱등성: 중복 무시
      this.doc.applyRemote(op);
      this.appliedOps.add(opKey);
    }
  }

  /**
   * 양방향 동기화: 서로의 미전송 연산을 교환
   */
  sync(otherSite) {
    const myOps = [...this.pendingOps];
    const theirOps = [...otherSite.pendingOps];

    otherSite.receiveOps(myOps);
    this.receiveOps(theirOps);

    this.pendingOps = [];
    otherSite.pendingOps = [];
  }

  /**
   * 현재 문서 텍스트
   */
  getText() {
    return this.doc.getText();
  }

  /**
   * 연산 큐 비우기 (연산은 반환)
   */
  flushOps() {
    const ops = [...this.pendingOps];
    this.pendingOps = [];
    return ops;
  }
}

module.exports = { Site };

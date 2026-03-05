/**
 * Simulator - 협업 시뮬레이터
 * 다중 사이트 관리, 랜덤 연산 생성, 동기화, 수렴성 검증
 */
const { Site } = require('./site');

class Simulator {
  constructor(siteIds) {
    this.sites = new Map();
    this.allOpsHistory = []; // 전체 연산 이력 (완전 동기화용)
    for (const id of siteIds) {
      this.sites.set(id, new Site(id));
    }
  }

  /**
   * 특정 사이트 반환
   */
  getSite(siteId) {
    return this.sites.get(siteId);
  }

  /**
   * 모든 사이트 반환
   */
  getAllSites() {
    return [...this.sites.values()];
  }

  /**
   * 전체 동기화: 모든 사이트 쌍 간 연산 교환
   * 모든 사이트의 pendingOps를 수집한 뒤 모든 사이트에 적용
   */
  syncAll() {
    // 모든 사이트에서 pending ops를 이력에 추가
    for (const site of this.sites.values()) {
      this.allOpsHistory.push(...site.pendingOps);
    }

    // 전체 이력을 모든 사이트에 적용 (멱등성으로 중복 무시)
    for (const site of this.sites.values()) {
      site.receiveOps(this.allOpsHistory);
      site.pendingOps = [];
    }
  }

  /**
   * 두 사이트 간 1:1 동기화
   */
  syncPair(siteIdA, siteIdB) {
    const siteA = this.sites.get(siteIdA);
    const siteB = this.sites.get(siteIdB);
    // pair sync 전에 pending ops를 이력에 기록
    this.allOpsHistory.push(...siteA.pendingOps);
    this.allOpsHistory.push(...siteB.pendingOps);
    siteA.sync(siteB);
  }

  /**
   * 모든 사이트의 텍스트가 동일한지 (수렴성) 확인
   */
  checkConvergence() {
    const sites = this.getAllSites();
    if (sites.length < 2) return true;
    const firstText = sites[0].getText();
    return sites.every(site => site.getText() === firstText);
  }

  /**
   * 랜덤 연산 생성 및 실행
   * @param {string} siteId 대상 사이트
   * @param {number} count 연산 수
   * @param {number} seed 시드 (재현 가능한 랜덤)
   */
  randomOps(siteId, count, seed = 42) {
    const site = this.sites.get(siteId);
    let rng = this._seedRandom(seed);

    const ops = [];
    for (let i = 0; i < count; i++) {
      const textLen = site.getText().length;
      const shouldInsert = textLen === 0 || rng() > 0.3;

      if (shouldInsert) {
        const pos = Math.floor(rng() * (textLen + 1));
        const char = String.fromCharCode(97 + Math.floor(rng() * 26)); // a-z
        const op = site.insert(pos, char);
        ops.push(op);
      } else {
        const pos = Math.floor(rng() * textLen);
        const op = site.delete(pos);
        ops.push(op);
      }
    }
    return ops;
  }

  /**
   * 시드 기반 의사 난수 생성기 (Mulberry32)
   */
  _seedRandom(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * 모든 사이트 텍스트 상태 요약
   */
  getStatus() {
    const status = {};
    for (const [id, site] of this.sites) {
      status[id] = {
        text: site.getText(),
        nodeCount: site.doc.getNodeCount(),
        visibleCount: site.doc.getVisibleCount(),
        pendingOps: site.pendingOps.length,
      };
    }
    return status;
  }
}

module.exports = { Simulator };

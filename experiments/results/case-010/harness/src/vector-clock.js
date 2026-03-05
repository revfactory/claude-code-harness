/**
 * VectorClock - Lamport 논리 시계
 * 인과성 추적 및 happens-before 관계 판단
 */
class VectorClock {
  constructor() {
    this.clocks = new Map(); // siteId -> clock value
  }

  /**
   * 특정 사이트의 시계 값 조회
   */
  get(siteId) {
    return this.clocks.get(siteId) || 0;
  }

  /**
   * 특정 사이트의 시계 증가
   */
  increment(siteId) {
    const current = this.get(siteId);
    this.clocks.set(siteId, current + 1);
    return current + 1;
  }

  /**
   * 다른 벡터 시계와 병합 (element-wise max)
   */
  merge(other) {
    for (const [siteId, clock] of other.clocks) {
      const current = this.get(siteId);
      if (clock > current) {
        this.clocks.set(siteId, clock);
      }
    }
  }

  /**
   * happens-before 관계: this <= other (모든 사이트에서)
   */
  happensBefore(other) {
    let strictlyLess = false;
    const allSites = new Set([...this.clocks.keys(), ...other.clocks.keys()]);
    for (const siteId of allSites) {
      const a = this.get(siteId);
      const b = other.get(siteId);
      if (a > b) return false;
      if (a < b) strictlyLess = true;
    }
    return strictlyLess;
  }

  /**
   * 동시 발생 (concurrent) 여부: 어느 쪽도 happens-before가 아님
   */
  isConcurrent(other) {
    return !this.happensBefore(other) && !other.happensBefore(this) && !this.equals(other);
  }

  equals(other) {
    const allSites = new Set([...this.clocks.keys(), ...other.clocks.keys()]);
    for (const siteId of allSites) {
      if (this.get(siteId) !== other.get(siteId)) return false;
    }
    return true;
  }

  clone() {
    const vc = new VectorClock();
    for (const [siteId, clock] of this.clocks) {
      vc.clocks.set(siteId, clock);
    }
    return vc;
  }

  toString() {
    const entries = [...this.clocks.entries()]
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([s, c]) => `${s}:${c}`);
    return `{${entries.join(', ')}}`;
  }
}

module.exports = { VectorClock };

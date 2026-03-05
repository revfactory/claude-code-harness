/**
 * CharId - 문자 고유 식별자
 * siteId + Lamport clock 조합으로 전역 고유성 보장
 */
class CharId {
  constructor(siteId, clock) {
    this.siteId = siteId;
    this.clock = clock;
  }

  /**
   * 비교: clock 우선, 같으면 siteId 사전순
   * @returns {number} 음수(this < other), 0(같음), 양수(this > other)
   */
  compareTo(other) {
    if (this.clock !== other.clock) return this.clock - other.clock;
    return this.siteId < other.siteId ? -1 : this.siteId > other.siteId ? 1 : 0;
  }

  equals(other) {
    return other !== null &&
      other !== undefined &&
      this.siteId === other.siteId &&
      this.clock === other.clock;
  }

  toString() {
    return `${this.siteId}:${this.clock}`;
  }
}

module.exports = { CharId };

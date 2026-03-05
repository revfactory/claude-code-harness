class AsyncCache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  /**
   * 공통 fetch 헬퍼: pending Map을 활용하여 동일 키에 대한 중복 요청 방지
   * try/finally로 에러 시에도 pending 정리 보장
   */
  _fetch(key, fetchFn) {
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    const promise = (async () => {
      try {
        const value = await fetchFn(key);
        this.cache.set(key, value);
        return value;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, promise);
    return promise;
  }

  async get(key, fetchFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    return this._fetch(key, fetchFn);
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  async refresh(key, fetchFn) {
    this.cache.delete(key);
    // pending에 있던 이전 요청은 그대로 두고 새 fetch를 강제 시작
    // 기존 pending을 삭제하여 _fetch가 새 Promise를 생성하도록 함
    this.pending.delete(key);
    return this._fetch(key, fetchFn);
  }
}

module.exports = { AsyncCache };

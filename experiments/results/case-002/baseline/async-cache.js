class AsyncCache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  async get(key, fetchFn) {
    // 1. Return cached value if available
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // 2. If a fetch is already in-flight for this key, wait for it
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // 3. Start a new fetch and store the promise so concurrent callers share it
    const promise = fetchFn(key).then(
      (value) => {
        this.cache.set(key, value);
        this.pending.delete(key);
        return value;
      },
      (err) => {
        // Clean up pending on error so future calls can retry
        this.pending.delete(key);
        throw err;
      }
    );

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key) {
    this.cache.delete(key);
    // Note: does not cancel in-flight fetches; they will re-populate the cache
  }

  async refresh(key, fetchFn) {
    this.cache.delete(key);

    // If there's already a pending request, we don't re-use it —
    // refresh explicitly means "fetch a new value".
    // But we DO store the new promise so concurrent get() calls wait for it.
    const promise = fetchFn(key).then(
      (value) => {
        this.cache.set(key, value);
        this.pending.delete(key);
        return value;
      },
      (err) => {
        this.pending.delete(key);
        throw err;
      }
    );

    this.pending.set(key, promise);
    return promise;
  }
}

module.exports = { AsyncCache };

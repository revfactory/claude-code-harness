/**
 * EventBus - Pub/Sub 이벤트 버스
 * 와일드카드 패턴 매칭, 비동기 핸들러, 에러 격리 지원
 */

class EventBus {
  constructor() {
    this.handlers = new Map();          // event → Set<handler>
    this.wildcardHandlers = new Map();  // pattern → Set<handler>
    this.history = [];                  // 이벤트 히스토리
  }

  subscribe(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
    return () => this.unsubscribe(event, handler);
  }

  subscribePattern(pattern, handler) {
    if (!this.wildcardHandlers.has(pattern)) {
      this.wildcardHandlers.set(pattern, new Set());
    }
    this.wildcardHandlers.get(pattern).add(handler);
    return () => this.unsubscribePattern(pattern, handler);
  }

  subscribeOnce(event, handler) {
    const wrapper = async (data) => {
      this.unsubscribe(event, wrapper);
      return handler(data);
    };
    return this.subscribe(event, wrapper);
  }

  async publish(event, data) {
    const eventData = { ...data, _event: event, _timestamp: Date.now() };
    this.history.push(eventData);

    const promises = [];

    // 1. 정확한 매칭 핸들러
    if (this.handlers.has(event)) {
      for (const handler of this.handlers.get(event)) {
        promises.push(
          Promise.resolve()
            .then(() => handler(eventData))
            .catch((err) => ({ _error: true, error: err }))
        );
      }
    }

    // 2. 와일드카드 매칭 핸들러
    for (const [pattern, handlerSet] of this.wildcardHandlers) {
      if (this._matchPattern(pattern, event)) {
        for (const handler of handlerSet) {
          promises.push(
            Promise.resolve()
              .then(() => handler(eventData))
              .catch((err) => ({ _error: true, error: err }))
          );
        }
      }
    }

    // 3. Promise.allSettled로 모든 핸들러 처리 (에러 격리)
    const results = await Promise.allSettled(promises);
    return results;
  }

  unsubscribe(event, handler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(handler);
    }
  }

  unsubscribePattern(pattern, handler) {
    if (this.wildcardHandlers.has(pattern)) {
      this.wildcardHandlers.get(pattern).delete(handler);
    }
  }

  _matchPattern(pattern, event) {
    // 'order.*' matches 'order.created', 'order.confirmed', etc.
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$'
    );
    return regex.test(event);
  }

  getHistory(filter) {
    if (!filter) return [...this.history];
    return this.history.filter((e) => e._event.startsWith(filter));
  }

  clear() {
    this.handlers.clear();
    this.wildcardHandlers.clear();
    this.history = [];
  }
}

module.exports = { EventBus };

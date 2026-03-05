/**
 * EventBus - 비동기 pub/sub with 와일드카드 지원 및 correlation ID 추적
 */
class EventBus {
  constructor() {
    this.subscribers = new Map();
    this.eventLog = [];
  }

  subscribe(pattern, handler) {
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, []);
    }
    this.subscribers.get(pattern).push(handler);
    return () => {
      const handlers = this.subscribers.get(pattern);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    };
  }

  async publish(eventType, payload) {
    const event = {
      type: eventType,
      payload,
      correlationId: payload.correlationId || payload.orderId,
      timestamp: Date.now(),
    };

    this.eventLog.push(event);

    const matchingHandlers = [];

    for (const [pattern, handlers] of this.subscribers) {
      if (this._matches(pattern, eventType)) {
        matchingHandlers.push(...handlers);
      }
    }

    // 비동기 실행 - 모든 핸들러를 마이크로태스크로 실행
    const results = [];
    for (const handler of matchingHandlers) {
      try {
        const result = await Promise.resolve().then(() => handler(event));
        results.push(result);
      } catch (err) {
        console.error(`EventBus handler error for ${eventType}:`, err.message);
      }
    }

    return results;
  }

  _matches(pattern, eventType) {
    if (pattern === eventType) return true;
    // 와일드카드: order.* matches order.created, order.confirmed 등
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$');
      return regex.test(eventType);
    }
    return false;
  }

  getEventsForCorrelation(correlationId) {
    return this.eventLog.filter(e => e.correlationId === correlationId);
  }

  getEventLog() {
    return [...this.eventLog];
  }

  clear() {
    this.eventLog = [];
  }
}

module.exports = { EventBus };

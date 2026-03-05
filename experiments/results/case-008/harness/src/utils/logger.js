/**
 * 이벤트 추적 로거
 * correlation ID 기반 이벤트 흐름 기록
 */

class Logger {
  constructor() {
    this.logs = [];
  }

  log(correlationId, event, data = {}) {
    const entry = {
      timestamp: Date.now(),
      correlationId,
      event,
      data,
    };
    this.logs.push(entry);
    return entry;
  }

  getByCorrelationId(correlationId) {
    return this.logs.filter((l) => l.correlationId === correlationId);
  }

  getByEvent(event) {
    return this.logs.filter((l) => l.event === event);
  }

  clear() {
    this.logs = [];
  }
}

module.exports = { Logger };

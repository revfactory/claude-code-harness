/**
 * SAGA Orchestrator - 분산 트랜잭션 보상 패턴
 * 타임아웃 지원
 */
class SagaOrchestrator {
  constructor(eventBus, options = {}) {
    this.eventBus = eventBus;
    this.sagas = new Map();
    this.timeout = options.timeout || 5000;
  }

  async executeSaga(orderId, correlationId) {
    const saga = {
      orderId,
      correlationId,
      status: 'STARTED',
      steps: [],
      startedAt: Date.now(),
    };
    this.sagas.set(orderId, saga);

    return new Promise((resolve, reject) => {
      let timer;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        unsubs.forEach(fn => fn());
      };

      const unsubs = [];

      // 성공 경로 감지
      unsubs.push(this.eventBus.subscribe('order.confirmed', (event) => {
        if (event.payload.orderId === orderId) {
          saga.status = 'COMPLETED';
          saga.steps.push({ event: 'order.confirmed', at: Date.now() });
          cleanup();
          resolve({ status: 'COMPLETED', saga });
        }
      }));

      // 실패 경로 감지
      unsubs.push(this.eventBus.subscribe('order.cancelled', (event) => {
        if (event.payload.orderId === orderId) {
          saga.status = 'COMPENSATED';
          saga.steps.push({ event: 'order.cancelled', reason: event.payload.reason, at: Date.now() });
          cleanup();
          resolve({ status: 'COMPENSATED', saga, reason: event.payload.reason });
        }
      }));

      // 중간 단계 추적
      unsubs.push(this.eventBus.subscribe('inventory.reserved', (event) => {
        if (event.payload.orderId === orderId) {
          saga.steps.push({ event: 'inventory.reserved', at: Date.now() });
        }
      }));

      unsubs.push(this.eventBus.subscribe('inventory.failed', (event) => {
        if (event.payload.orderId === orderId) {
          saga.steps.push({ event: 'inventory.failed', at: Date.now() });
        }
      }));

      unsubs.push(this.eventBus.subscribe('payment.completed', (event) => {
        if (event.payload.orderId === orderId) {
          saga.steps.push({ event: 'payment.completed', at: Date.now() });
        }
      }));

      unsubs.push(this.eventBus.subscribe('payment.failed', (event) => {
        if (event.payload.orderId === orderId) {
          saga.steps.push({ event: 'payment.failed', at: Date.now() });
        }
      }));

      unsubs.push(this.eventBus.subscribe('inventory.released', (event) => {
        if (event.payload.orderId === orderId) {
          saga.steps.push({ event: 'inventory.released', at: Date.now() });
        }
      }));

      // 타임아웃
      timer = setTimeout(() => {
        if (saga.status === 'STARTED') {
          saga.status = 'TIMED_OUT';
          cleanup();
          resolve({ status: 'TIMED_OUT', saga });
        }
      }, this.timeout);
    });
  }

  getSaga(orderId) {
    return this.sagas.get(orderId);
  }
}

module.exports = { SagaOrchestrator };

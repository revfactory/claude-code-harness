/**
 * PaymentService - 결제 처리
 * 멱등성(idempotency) 보장: 동일 orderId로 중복 결제 방지
 * 이벤트: payment.completed, payment.failed, payment.refunded
 */

class PaymentService {
  constructor(eventBus, options = {}) {
    this.eventBus = eventBus;
    this.payments = new Map();           // orderId → Payment
    this.processedOrders = new Set();    // orderId 중복 방지 (멱등성)
    this.shouldFail = options.shouldFail || false;  // 테스트용 실패 플래그
    this.failForOrders = options.failForOrders || new Set();
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    this.eventBus.subscribe('inventory.reserved', async (data) => {
      try {
        await this.charge(data.orderId, data.correlationId);
      } catch (error) {
        await this.eventBus.publish('payment.failed', {
          orderId: data.orderId,
          reason: error.message,
          correlationId: data.correlationId,
        });
      }
    });
  }

  async charge(orderId, correlationId, amount) {
    // 멱등성: 이미 처리된 주문이면 기존 결과 반환
    if (this.processedOrders.has(orderId)) {
      return this.payments.get(orderId);
    }

    // 테스트용 실패 시뮬레이션
    if (this.shouldFail || this.failForOrders.has(orderId)) {
      throw new Error(`Payment failed for order ${orderId}`);
    }

    const payment = {
      orderId,
      amount,
      status: 'COMPLETED',
      correlationId,
      processedAt: Date.now(),
    };

    this.payments.set(orderId, payment);
    this.processedOrders.add(orderId);

    await this.eventBus.publish('payment.completed', {
      orderId,
      paymentId: `pay-${orderId}`,
      correlationId,
    });

    return payment;
  }

  async refund(orderId, correlationId) {
    const payment = this.payments.get(orderId);
    if (!payment) return null;

    payment.status = 'REFUNDED';
    payment.refundedAt = Date.now();

    await this.eventBus.publish('payment.refunded', {
      orderId,
      correlationId,
    });

    return payment;
  }

  getPayment(orderId) {
    return this.payments.get(orderId) || null;
  }

  clear() {
    this.payments.clear();
    this.processedOrders.clear();
  }
}

module.exports = { PaymentService };

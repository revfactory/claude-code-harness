/**
 * PaymentService - charge/refund, 멱등성, 금액 초과시 실패
 */
class PaymentService {
  constructor(eventBus, options = {}) {
    this.eventBus = eventBus;
    this.payments = new Map();       // orderId → payment record
    this.idempotencyKeys = new Set();
    this.maxAmount = options.maxAmount || 10000;
    this.balances = new Map();       // userId → balance (시뮬레이션용)
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    // 재고 예약 완료 시 결제 시도
    this.eventBus.subscribe('inventory.reserved', async (event) => {
      const { orderId, correlationId } = event.payload;
      // 결제에 필요한 정보는 원래 order에서 가져와야 하지만,
      // 여기서는 이벤트 payload에 totalAmount가 없으므로
      // order.created 이벤트의 payload를 참조
      const orderCreatedEvent = this.eventBus.getEventsForCorrelation(correlationId)
        .find(e => e.type === 'order.created');

      if (!orderCreatedEvent) {
        await this.eventBus.publish('payment.failed', {
          orderId,
          reason: 'Order data not found',
          correlationId,
        });
        return;
      }

      const { totalAmount } = orderCreatedEvent.payload;

      try {
        await this.charge(orderId, totalAmount, correlationId);
        await this.eventBus.publish('payment.completed', {
          orderId,
          amount: totalAmount,
          correlationId,
        });
      } catch (err) {
        await this.eventBus.publish('payment.failed', {
          orderId,
          reason: err.message,
          amount: totalAmount,
          correlationId,
        });
      }
    });
  }

  async charge(orderId, amount, correlationId) {
    // 멱등성 체크
    const idempotencyKey = `charge:${orderId}`;
    if (this.idempotencyKeys.has(idempotencyKey)) {
      const existing = this.payments.get(orderId);
      if (existing) return existing;
    }

    // 금액 초과 체크
    if (amount > this.maxAmount) {
      throw new Error(`Payment amount ${amount} exceeds maximum ${this.maxAmount}`);
    }

    const payment = {
      orderId,
      amount,
      status: 'CHARGED',
      correlationId: correlationId || orderId,
      chargedAt: Date.now(),
    };

    this.payments.set(orderId, payment);
    this.idempotencyKeys.add(idempotencyKey);

    return payment;
  }

  async refund(orderId) {
    const payment = this.payments.get(orderId);
    if (!payment) throw new Error(`No payment found for order ${orderId}`);
    if (payment.status === 'REFUNDED') return payment;

    payment.status = 'REFUNDED';
    payment.refundedAt = Date.now();

    await this.eventBus.publish('payment.refunded', {
      orderId,
      amount: payment.amount,
      correlationId: payment.correlationId,
    });

    return payment;
  }

  getPayment(orderId) {
    return this.payments.get(orderId);
  }
}

module.exports = { PaymentService };

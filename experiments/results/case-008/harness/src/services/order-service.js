/**
 * OrderService - 주문 CRUD + 상태 관리
 * 이벤트: order.created, order.confirmed, order.cancelled
 */

class OrderService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.orders = new Map();
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    // payment 완료 시 주문 확정
    this.eventBus.subscribe('payment.completed', async (data) => {
      const order = this.orders.get(data.orderId);
      if (order && order.status === 'PENDING') {
        order.status = 'CONFIRMED';
        order.updatedAt = Date.now();
        await this.eventBus.publish('order.confirmed', {
          orderId: order.id,
          correlationId: data.correlationId,
        });
      }
    });

    // 재고 실패 시 주문 취소
    this.eventBus.subscribe('inventory.failed', async (data) => {
      await this._cancelOrder(data.orderId, data.correlationId, 'INVENTORY_FAILED');
    });

    // 결제 실패 시 주문 취소
    this.eventBus.subscribe('payment.failed', async (data) => {
      await this._cancelOrder(data.orderId, data.correlationId, 'PAYMENT_FAILED');
    });
  }

  async createOrder({ orderId, productId, quantity, amount, correlationId }) {
    const order = {
      id: orderId,
      productId,
      quantity,
      amount,
      status: 'PENDING',
      correlationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.orders.set(orderId, order);

    await this.eventBus.publish('order.created', {
      orderId: order.id,
      productId,
      quantity,
      amount,
      correlationId,
    });

    return order;
  }

  async _cancelOrder(orderId, correlationId, reason) {
    const order = this.orders.get(orderId);
    if (order && order.status !== 'CANCELLED') {
      order.status = 'CANCELLED';
      order.cancelReason = reason;
      order.updatedAt = Date.now();
      await this.eventBus.publish('order.cancelled', {
        orderId: order.id,
        reason,
        correlationId,
      });
    }
  }

  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  getAllOrders() {
    return [...this.orders.values()];
  }

  clear() {
    this.orders.clear();
  }
}

module.exports = { OrderService };

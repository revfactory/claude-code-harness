/**
 * OrderService - 주문 CRUD, 상태 관리
 * 상태: PENDING → CONFIRMED → SHIPPED / CANCELLED
 */
class OrderService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.orders = new Map();
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    // 결제 완료 시 주문 확정
    this.eventBus.subscribe('payment.completed', async (event) => {
      const { orderId } = event.payload;
      await this.confirmOrder(orderId);
    });

    // 재고 실패 시 주문 취소
    this.eventBus.subscribe('inventory.failed', async (event) => {
      const { orderId, reason } = event.payload;
      await this.cancelOrder(orderId, reason || 'inventory_failed');
    });

    // 결제 실패 시 주문 취소
    this.eventBus.subscribe('payment.failed', async (event) => {
      const { orderId, reason } = event.payload;
      await this.cancelOrder(orderId, reason || 'payment_failed');
    });
  }

  async createOrder({ orderId, items, totalAmount, correlationId }) {
    const order = {
      orderId,
      items,
      totalAmount,
      status: 'PENDING',
      correlationId: correlationId || orderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.orders.set(orderId, order);

    await this.eventBus.publish('order.created', {
      orderId,
      items,
      totalAmount,
      correlationId: order.correlationId,
    });

    return order;
  }

  async confirmOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== 'PENDING') return order;

    order.status = 'CONFIRMED';
    order.updatedAt = Date.now();

    await this.eventBus.publish('order.confirmed', {
      orderId,
      correlationId: order.correlationId,
    });

    return order;
  }

  async shipOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== 'CONFIRMED') throw new Error(`Order ${orderId} is not confirmed`);

    order.status = 'SHIPPED';
    order.updatedAt = Date.now();

    await this.eventBus.publish('order.shipped', {
      orderId,
      correlationId: order.correlationId,
    });

    return order;
  }

  async cancelOrder(orderId, reason = 'unknown') {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status === 'CANCELLED') return order;

    order.status = 'CANCELLED';
    order.cancelReason = reason;
    order.updatedAt = Date.now();

    await this.eventBus.publish('order.cancelled', {
      orderId,
      reason,
      correlationId: order.correlationId,
    });

    return order;
  }

  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  getAllOrders() {
    return [...this.orders.values()];
  }
}

module.exports = { OrderService };

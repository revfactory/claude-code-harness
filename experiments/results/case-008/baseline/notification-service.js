/**
 * NotificationService - 이벤트 기반 알림
 */
class NotificationService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.notifications = [];
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    // 모든 order 이벤트 구독 (와일드카드)
    this.eventBus.subscribe('order.*', (event) => {
      this._addNotification(event.type, event.payload, event.correlationId);
    });

    // 결제 이벤트 구독
    this.eventBus.subscribe('payment.*', (event) => {
      this._addNotification(event.type, event.payload, event.correlationId);
    });

    // 재고 이벤트 구독
    this.eventBus.subscribe('inventory.*', (event) => {
      this._addNotification(event.type, event.payload, event.correlationId);
    });
  }

  _addNotification(type, payload, correlationId) {
    const message = this._formatMessage(type, payload);
    this.notifications.push({
      type,
      message,
      correlationId,
      orderId: payload.orderId,
      timestamp: Date.now(),
    });
  }

  _formatMessage(type, payload) {
    const messages = {
      'order.created': `주문 ${payload.orderId} 생성됨 (금액: ${payload.totalAmount})`,
      'order.confirmed': `주문 ${payload.orderId} 확정됨`,
      'order.shipped': `주문 ${payload.orderId} 배송 시작`,
      'order.cancelled': `주문 ${payload.orderId} 취소됨 (사유: ${payload.reason})`,
      'payment.completed': `결제 완료 - 주문 ${payload.orderId} (${payload.amount}원)`,
      'payment.failed': `결제 실패 - 주문 ${payload.orderId} (${payload.reason})`,
      'payment.refunded': `환불 완료 - 주문 ${payload.orderId} (${payload.amount}원)`,
      'inventory.reserved': `재고 예약됨 - 주문 ${payload.orderId}`,
      'inventory.failed': `재고 부족 - 주문 ${payload.orderId} (${payload.reason})`,
      'inventory.released': `재고 복원됨 - 주문 ${payload.orderId}`,
      'inventory.deducted': `재고 차감됨 - 주문 ${payload.orderId}`,
    };
    return messages[type] || `${type}: ${JSON.stringify(payload)}`;
  }

  getNotifications(orderId) {
    if (orderId) {
      return this.notifications.filter(n => n.orderId === orderId);
    }
    return [...this.notifications];
  }

  getNotificationsByCorrelation(correlationId) {
    return this.notifications.filter(n => n.correlationId === correlationId);
  }

  clear() {
    this.notifications = [];
  }
}

module.exports = { NotificationService };

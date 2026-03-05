/**
 * NotificationService - 알림 이력 관리
 * 이벤트: notification.sent
 */

class NotificationService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.notifications = [];
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    // 주문 확정 알림
    this.eventBus.subscribe('order.confirmed', async (data) => {
      await this._sendNotification({
        type: 'ORDER_CONFIRMED',
        orderId: data.orderId,
        message: `주문 ${data.orderId}이 확정되었습니다.`,
        correlationId: data.correlationId,
      });
    });

    // 주문 취소 알림
    this.eventBus.subscribe('order.cancelled', async (data) => {
      await this._sendNotification({
        type: 'ORDER_CANCELLED',
        orderId: data.orderId,
        reason: data.reason,
        message: `주문 ${data.orderId}이 취소되었습니다. 사유: ${data.reason}`,
        correlationId: data.correlationId,
      });
    });
  }

  async _sendNotification(notification) {
    const entry = {
      ...notification,
      sentAt: Date.now(),
    };
    this.notifications.push(entry);

    await this.eventBus.publish('notification.sent', {
      type: notification.type,
      orderId: notification.orderId,
      correlationId: notification.correlationId,
    });

    return entry;
  }

  getNotifications(orderId) {
    if (orderId) {
      return this.notifications.filter((n) => n.orderId === orderId);
    }
    return [...this.notifications];
  }

  getByCorrelationId(correlationId) {
    return this.notifications.filter((n) => n.correlationId === correlationId);
  }

  clear() {
    this.notifications = [];
  }
}

module.exports = { NotificationService };

/**
 * InventoryService - 재고 관리, reserve/release/deduct, 낙관적 잠금
 */
class InventoryService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.inventory = new Map();      // productId → { quantity, version }
    this.reservations = new Map();   // orderId → [{ productId, quantity }]
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    // 주문 생성 시 재고 예약 시도
    this.eventBus.subscribe('order.created', async (event) => {
      const { orderId, items, correlationId } = event.payload;
      try {
        await this.reserveItems(orderId, items);
        await this.eventBus.publish('inventory.reserved', {
          orderId,
          items,
          correlationId,
        });
      } catch (err) {
        await this.eventBus.publish('inventory.failed', {
          orderId,
          reason: err.message,
          correlationId,
        });
      }
    });

    // 결제 실패 시 재고 복원
    this.eventBus.subscribe('payment.failed', async (event) => {
      const { orderId, correlationId } = event.payload;
      try {
        await this.releaseReservation(orderId);
        await this.eventBus.publish('inventory.released', {
          orderId,
          correlationId,
        });
      } catch (err) {
        console.error(`Failed to release inventory for order ${orderId}:`, err.message);
      }
    });

    // 주문 확정 시 재고 차감
    this.eventBus.subscribe('order.confirmed', async (event) => {
      const { orderId, correlationId } = event.payload;
      try {
        await this.deductReservation(orderId);
        await this.eventBus.publish('inventory.deducted', {
          orderId,
          correlationId,
        });
      } catch (err) {
        console.error(`Failed to deduct inventory for order ${orderId}:`, err.message);
      }
    });
  }

  addStock(productId, quantity) {
    const existing = this.inventory.get(productId);
    if (existing) {
      existing.quantity += quantity;
      existing.version++;
    } else {
      this.inventory.set(productId, { quantity, version: 1 });
    }
  }

  getStock(productId) {
    const item = this.inventory.get(productId);
    return item ? item.quantity : 0;
  }

  async reserveItems(orderId, items) {
    // 낙관적 잠금: 버전 체크 후 예약
    const snapshots = [];

    // 먼저 모든 항목의 재고 확인
    for (const item of items) {
      const stock = this.inventory.get(item.productId);
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productId}: need ${item.quantity}, have ${stock ? stock.quantity : 0}`);
      }
      snapshots.push({ productId: item.productId, version: stock.version });
    }

    // 낙관적 잠금 - 버전 재확인 후 차감
    for (let i = 0; i < items.length; i++) {
      const stock = this.inventory.get(items[i].productId);
      if (stock.version !== snapshots[i].version) {
        // 롤백 이미 예약한 항목들
        for (let j = 0; j < i; j++) {
          const prevStock = this.inventory.get(items[j].productId);
          prevStock.quantity += items[j].quantity;
          prevStock.version++;
        }
        throw new Error(`Optimistic lock conflict for ${items[i].productId}`);
      }
      stock.quantity -= items[i].quantity;
      stock.version++;
    }

    this.reservations.set(orderId, items.map(i => ({ ...i })));
  }

  async releaseReservation(orderId) {
    const reserved = this.reservations.get(orderId);
    if (!reserved) return;

    for (const item of reserved) {
      const stock = this.inventory.get(item.productId);
      if (stock) {
        stock.quantity += item.quantity;
        stock.version++;
      }
    }

    this.reservations.delete(orderId);
  }

  async deductReservation(orderId) {
    // 예약된 항목은 이미 재고에서 차감됨, 예약 정보만 제거
    this.reservations.delete(orderId);
  }

  getReservation(orderId) {
    return this.reservations.get(orderId);
  }
}

module.exports = { InventoryService };

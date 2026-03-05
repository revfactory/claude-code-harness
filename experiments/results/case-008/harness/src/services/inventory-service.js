/**
 * InventoryService - 재고 관리
 * 낙관적 잠금(optimistic locking) 적용
 * 이벤트: inventory.reserved, inventory.released, inventory.failed
 */

class InsufficientStockError extends Error {
  constructor(productId, requested, available) {
    super(`Insufficient stock for ${productId}: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
    this.productId = productId;
    this.requested = requested;
    this.available = available;
  }
}

class ConcurrencyError extends Error {
  constructor(productId) {
    super(`Concurrency conflict for product ${productId}`);
    this.name = 'ConcurrencyError';
    this.productId = productId;
  }
}

class InventoryService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.inventory = new Map();        // productId → { quantity, version }
    this.reservations = new Map();     // orderId → { productId, quantity }
    this._setupSubscriptions();
  }

  _setupSubscriptions() {
    this.eventBus.subscribe('order.created', async (data) => {
      try {
        await this.reserve(data.productId, data.quantity, data.orderId, data.correlationId);
      } catch (error) {
        await this.eventBus.publish('inventory.failed', {
          orderId: data.orderId,
          productId: data.productId,
          reason: error.message,
          correlationId: data.correlationId,
        });
      }
    });

    // 결제 실패 시 재고 해제
    this.eventBus.subscribe('payment.failed', async (data) => {
      await this.release(data.orderId, data.correlationId);
    });
  }

  addProduct(productId, quantity) {
    this.inventory.set(productId, { quantity, version: 0 });
  }

  async reserve(productId, quantity, orderId, correlationId) {
    const item = this.inventory.get(productId);
    if (!item) {
      throw new InsufficientStockError(productId, quantity, 0);
    }

    const snapshotVersion = item.version;

    if (item.quantity < quantity) {
      throw new InsufficientStockError(productId, quantity, item.quantity);
    }

    // 낙관적 잠금: 버전 체크
    if (item.version !== snapshotVersion) {
      throw new ConcurrencyError(productId);
    }

    item.quantity -= quantity;
    item.version++;

    this.reservations.set(orderId, { productId, quantity });

    await this.eventBus.publish('inventory.reserved', {
      orderId,
      productId,
      quantity,
      remainingStock: item.quantity,
      version: item.version,
      correlationId,
    });

    return { reserved: quantity, version: item.version };
  }

  async release(orderId, correlationId) {
    const reservation = this.reservations.get(orderId);
    if (!reservation) return;

    const item = this.inventory.get(reservation.productId);
    if (item) {
      item.quantity += reservation.quantity;
      item.version++;
    }

    this.reservations.delete(orderId);

    await this.eventBus.publish('inventory.released', {
      orderId,
      productId: reservation.productId,
      quantity: reservation.quantity,
      correlationId,
    });
  }

  getStock(productId) {
    const item = this.inventory.get(productId);
    return item ? { ...item } : null;
  }

  getReservation(orderId) {
    return this.reservations.get(orderId) || null;
  }

  clear() {
    this.inventory.clear();
    this.reservations.clear();
  }
}

module.exports = { InventoryService, InsufficientStockError, ConcurrencyError };

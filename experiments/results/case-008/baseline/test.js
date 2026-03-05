/**
 * 이벤트 드리븐 마이크로서비스 주문 시스템 테스트
 * 5개 시나리오: 정상 플로우, 재고 부족, 결제 실패, 동시 주문, 타임아웃
 */
const { EventBus } = require('./event-bus');
const { OrderService } = require('./order-service');
const { InventoryService } = require('./inventory-service');
const { PaymentService } = require('./payment-service');
const { NotificationService } = require('./notification-service');
const { SagaOrchestrator } = require('./saga-orchestrator');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`  FAIL: ${name}`);
    console.log(`        ${err.message}`);
    testsFailed++;
  }
}

function createSystem(paymentOptions = {}) {
  const eventBus = new EventBus();
  const orderService = new OrderService(eventBus);
  const inventoryService = new InventoryService(eventBus);
  const paymentService = new PaymentService(eventBus, paymentOptions);
  const notificationService = new NotificationService(eventBus);
  const sagaOrchestrator = new SagaOrchestrator(eventBus);
  return { eventBus, orderService, inventoryService, paymentService, notificationService, sagaOrchestrator };
}

async function test1_NormalFlow() {
  const { eventBus, orderService, inventoryService, paymentService, notificationService, sagaOrchestrator } = createSystem();

  // 재고 초기화
  inventoryService.addStock('ITEM-A', 10);
  inventoryService.addStock('ITEM-B', 5);

  const correlationId = 'corr-001';
  const orderId = 'ORD-001';

  // SAGA 실행과 주문 생성을 동시에
  const sagaPromise = sagaOrchestrator.executeSaga(orderId, correlationId);

  await orderService.createOrder({
    orderId,
    items: [
      { productId: 'ITEM-A', quantity: 2 },
      { productId: 'ITEM-B', quantity: 1 },
    ],
    totalAmount: 500,
    correlationId,
  });

  const result = await sagaPromise;

  // 검증
  assert(result.status === 'COMPLETED', `SAGA should complete, got ${result.status}`);

  const order = orderService.getOrder(orderId);
  assert(order.status === 'CONFIRMED', `Order should be CONFIRMED, got ${order.status}`);

  // 재고 확인 (예약 후 차감)
  assert(inventoryService.getStock('ITEM-A') === 8, `ITEM-A stock should be 8, got ${inventoryService.getStock('ITEM-A')}`);
  assert(inventoryService.getStock('ITEM-B') === 4, `ITEM-B stock should be 4, got ${inventoryService.getStock('ITEM-B')}`);

  // 결제 확인
  const payment = paymentService.getPayment(orderId);
  assert(payment && payment.status === 'CHARGED', 'Payment should be CHARGED');
  assert(payment.amount === 500, `Payment amount should be 500, got ${payment.amount}`);

  // 알림 확인
  const notifications = notificationService.getNotifications(orderId);
  assert(notifications.length > 0, 'Should have notifications');

  // correlation ID 추적
  const events = eventBus.getEventsForCorrelation(correlationId);
  assert(events.length >= 4, `Should have at least 4 events, got ${events.length}`);
  const eventTypes = events.map(e => e.type);
  assert(eventTypes.includes('order.created'), 'Should have order.created event');
  assert(eventTypes.includes('inventory.reserved'), 'Should have inventory.reserved event');
  assert(eventTypes.includes('payment.completed'), 'Should have payment.completed event');
  assert(eventTypes.includes('order.confirmed'), 'Should have order.confirmed event');
}

async function test2_InsufficientStock() {
  const { eventBus, orderService, inventoryService, notificationService, sagaOrchestrator } = createSystem();

  // 재고 부족하게 설정
  inventoryService.addStock('ITEM-X', 1);

  const correlationId = 'corr-002';
  const orderId = 'ORD-002';

  const sagaPromise = sagaOrchestrator.executeSaga(orderId, correlationId);

  await orderService.createOrder({
    orderId,
    items: [{ productId: 'ITEM-X', quantity: 5 }], // 5개 필요, 1개만 있음
    totalAmount: 300,
    correlationId,
  });

  const result = await sagaPromise;

  assert(result.status === 'COMPENSATED', `SAGA should be COMPENSATED, got ${result.status}`);

  const order = orderService.getOrder(orderId);
  assert(order.status === 'CANCELLED', `Order should be CANCELLED, got ${order.status}`);

  // 재고는 원래대로 (1개)
  assert(inventoryService.getStock('ITEM-X') === 1, `Stock should remain 1, got ${inventoryService.getStock('ITEM-X')}`);

  // correlation ID 추적 - 보상 플로우
  const events = eventBus.getEventsForCorrelation(correlationId);
  const eventTypes = events.map(e => e.type);
  assert(eventTypes.includes('order.created'), 'Should have order.created');
  assert(eventTypes.includes('inventory.failed'), 'Should have inventory.failed');
  assert(eventTypes.includes('order.cancelled'), 'Should have order.cancelled');
}

async function test3_PaymentFailure() {
  const { eventBus, orderService, inventoryService, paymentService, notificationService, sagaOrchestrator } = createSystem({ maxAmount: 100 });

  // 재고 충분
  inventoryService.addStock('ITEM-Y', 10);

  const correlationId = 'corr-003';
  const orderId = 'ORD-003';

  const sagaPromise = sagaOrchestrator.executeSaga(orderId, correlationId);

  await orderService.createOrder({
    orderId,
    items: [{ productId: 'ITEM-Y', quantity: 3 }],
    totalAmount: 500, // maxAmount(100) 초과 → 결제 실패
    correlationId,
  });

  const result = await sagaPromise;

  assert(result.status === 'COMPENSATED', `SAGA should be COMPENSATED, got ${result.status}`);

  const order = orderService.getOrder(orderId);
  assert(order.status === 'CANCELLED', `Order should be CANCELLED, got ${order.status}`);

  // 재고 원복 확인 (예약 → 해제)
  assert(inventoryService.getStock('ITEM-Y') === 10, `Stock should be restored to 10, got ${inventoryService.getStock('ITEM-Y')}`);

  // 예약 정보 삭제 확인
  assert(!inventoryService.getReservation(orderId), 'Reservation should be cleared');

  // correlation ID 추적 - 결제 실패 보상 플로우
  const events = eventBus.getEventsForCorrelation(correlationId);
  const eventTypes = events.map(e => e.type);
  assert(eventTypes.includes('order.created'), 'Should have order.created');
  assert(eventTypes.includes('inventory.reserved'), 'Should have inventory.reserved');
  assert(eventTypes.includes('payment.failed'), 'Should have payment.failed');
  assert(eventTypes.includes('inventory.released'), 'Should have inventory.released');
  assert(eventTypes.includes('order.cancelled'), 'Should have order.cancelled');
}

async function test4_ConcurrentOrders() {
  const { eventBus, orderService, inventoryService, sagaOrchestrator } = createSystem();

  // 재고 3개만 설정
  inventoryService.addStock('LIMITED', 3);

  const orders = [];
  const sagas = [];

  // 5개 동시 주문 (각 2개씩 → 총 10개 필요, 3개만 있음)
  for (let i = 0; i < 5; i++) {
    const orderId = `CONC-${i}`;
    const correlationId = `corr-conc-${i}`;
    sagas.push(sagaOrchestrator.executeSaga(orderId, correlationId));
    orders.push(
      orderService.createOrder({
        orderId,
        items: [{ productId: 'LIMITED', quantity: 2 }],
        totalAmount: 100,
        correlationId,
      })
    );
  }

  await Promise.all(orders);
  const results = await Promise.all(sagas);

  const completed = results.filter(r => r.status === 'COMPLETED').length;
  const compensated = results.filter(r => r.status === 'COMPENSATED').length;

  // 재고 3개에서 각 2개씩 → 최대 1개 주문만 성공 가능
  assert(completed >= 1, `At least 1 order should complete, got ${completed}`);
  assert(compensated >= 1, `At least 1 order should be compensated, got ${compensated}`);
  assert(completed + compensated === 5, `Total should be 5, got ${completed + compensated}`);

  // 남은 재고 검증 (음수가 되면 안됨)
  const remaining = inventoryService.getStock('LIMITED');
  assert(remaining >= 0, `Stock should not be negative, got ${remaining}`);
}

async function test5_Timeout() {
  const eventBus = new EventBus();
  const orderService = new OrderService(eventBus);
  // InventoryService를 생성하지 않아서 이벤트 핸들러 없음 → 타임아웃 발생
  const sagaOrchestrator = new SagaOrchestrator(eventBus, { timeout: 200 });

  const orderId = 'TIMEOUT-001';
  const correlationId = 'corr-timeout';

  const sagaPromise = sagaOrchestrator.executeSaga(orderId, correlationId);

  // 주문 생성하지만 아무 서비스도 응답 안함 (InventoryService 없음)
  await orderService.createOrder({
    orderId,
    items: [{ productId: 'GHOST', quantity: 1 }],
    totalAmount: 100,
    correlationId,
  });

  const result = await sagaPromise;

  assert(result.status === 'TIMED_OUT', `SAGA should time out, got ${result.status}`);
}

async function main() {
  console.log('=== Event-Driven Microservice Order System Tests ===\n');

  await runTest('1. 정상 주문 플로우', test1_NormalFlow);
  await runTest('2. 재고 부족 보상', test2_InsufficientStock);
  await runTest('3. 결제 실패 보상 (재고 원복)', test3_PaymentFailure);
  await runTest('4. 동시 주문 경쟁', test4_ConcurrentOrders);
  await runTest('5. 타임아웃', test5_Timeout);

  console.log(`\n=== Results: ${testsPassed} passed, ${testsFailed} failed ===`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

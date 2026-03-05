/**
 * 통합 테스트 - 5개 시나리오
 * 1. 정상 플로우
 * 2. 재고 부족
 * 3. 결제 실패
 * 4. 동시 주문 (낙관적 잠금)
 * 5. 타임아웃 보상 트랜잭션
 */

const { EventBus } = require('../src/event-bus');
const { SagaOrchestrator } = require('../src/saga-orchestrator');
const { OrderService } = require('../src/services/order-service');
const { InventoryService } = require('../src/services/inventory-service');
const { PaymentService } = require('../src/services/payment-service');
const { NotificationService } = require('../src/services/notification-service');
const { Logger } = require('../src/utils/logger');
const { generateCorrelationId } = require('../src/utils/correlation-id');

// 이벤트 전파 대기 헬퍼
const waitForEvents = (ms = 100) => new Promise((r) => setTimeout(r, ms));

describe('통합 테스트: 이벤트 드리븐 주문 시스템', () => {
  let bus, logger, orderService, inventoryService, paymentService, notificationService;

  beforeEach(() => {
    bus = new EventBus();
    logger = new Logger();
    orderService = new OrderService(bus);
    inventoryService = new InventoryService(bus);
    notificationService = new NotificationService(bus);
  });

  // ================================================================
  // 시나리오 1: 정상 플로우
  // order.created → inventory.reserved → payment.completed → order.confirmed
  // ================================================================
  test('시나리오 1: 정상 주문 플로우 - 주문→재고예약→결제→확정', async () => {
    paymentService = new PaymentService(bus);
    inventoryService.addProduct('PROD-001', 10);
    const correlationId = generateCorrelationId();

    await orderService.createOrder({
      orderId: 'ORD-001',
      productId: 'PROD-001',
      quantity: 2,
      amount: 50000,
      correlationId,
    });

    await waitForEvents(200);

    // 주문 상태 확인
    const order = orderService.getOrder('ORD-001');
    expect(order.status).toBe('CONFIRMED');

    // 재고 차감 확인
    const stock = inventoryService.getStock('PROD-001');
    expect(stock.quantity).toBe(8);

    // 결제 완료 확인
    const payment = paymentService.getPayment('ORD-001');
    expect(payment).toBeTruthy();
    expect(payment.status).toBe('COMPLETED');

    // 알림 발송 확인
    const notifications = notificationService.getNotifications('ORD-001');
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications.some((n) => n.type === 'ORDER_CONFIRMED')).toBe(true);

    // correlation ID 추적
    const events = bus.getHistory();
    const correlatedEvents = events.filter((e) => e.correlationId === correlationId);
    expect(correlatedEvents.length).toBeGreaterThanOrEqual(3);
  });

  // ================================================================
  // 시나리오 2: 재고 부족
  // order.created → inventory.failed → order.cancelled
  // ================================================================
  test('시나리오 2: 재고 부족 - 주문→재고실패→취소', async () => {
    paymentService = new PaymentService(bus);
    inventoryService.addProduct('PROD-002', 1);
    const correlationId = generateCorrelationId();

    await orderService.createOrder({
      orderId: 'ORD-002',
      productId: 'PROD-002',
      quantity: 5, // 재고보다 많음
      amount: 100000,
      correlationId,
    });

    await waitForEvents(200);

    // 주문 취소 확인
    const order = orderService.getOrder('ORD-002');
    expect(order.status).toBe('CANCELLED');
    expect(order.cancelReason).toBe('INVENTORY_FAILED');

    // 재고 변동 없음
    const stock = inventoryService.getStock('PROD-002');
    expect(stock.quantity).toBe(1);

    // 결제 없음
    const payment = paymentService.getPayment('ORD-002');
    expect(payment).toBeNull();

    // 취소 알림
    const notifications = notificationService.getNotifications('ORD-002');
    expect(notifications.some((n) => n.type === 'ORDER_CANCELLED')).toBe(true);
  });

  // ================================================================
  // 시나리오 3: 결제 실패
  // order.created → inventory.reserved → payment.failed → inventory.released → order.cancelled
  // ================================================================
  test('시나리오 3: 결제 실패 - 주문→재고예약→결제실패→재고해제→취소', async () => {
    paymentService = new PaymentService(bus, { shouldFail: true });
    inventoryService.addProduct('PROD-003', 10);
    const correlationId = generateCorrelationId();

    await orderService.createOrder({
      orderId: 'ORD-003',
      productId: 'PROD-003',
      quantity: 3,
      amount: 75000,
      correlationId,
    });

    await waitForEvents(200);

    // 주문 취소 확인
    const order = orderService.getOrder('ORD-003');
    expect(order.status).toBe('CANCELLED');
    expect(order.cancelReason).toBe('PAYMENT_FAILED');

    // 재고 원복 확인
    const stock = inventoryService.getStock('PROD-003');
    expect(stock.quantity).toBe(10);

    // 예약 해제 확인
    const reservation = inventoryService.getReservation('ORD-003');
    expect(reservation).toBeNull();

    // 취소 알림
    const notifications = notificationService.getNotifications('ORD-003');
    expect(notifications.some((n) => n.type === 'ORDER_CANCELLED')).toBe(true);
  });

  // ================================================================
  // 시나리오 4: 동시 주문 (낙관적 잠금)
  // 2개 주문이 동시에 같은 상품 주문, 재고 1개 → 하나만 성공
  // ================================================================
  test('시나리오 4: 동시 주문 - 재고 1개에 2개 주문, 하나만 성공', async () => {
    paymentService = new PaymentService(bus);
    inventoryService.addProduct('PROD-004', 1); // 재고 1개

    const corr1 = generateCorrelationId();
    const corr2 = generateCorrelationId();

    // 동시 주문
    await Promise.all([
      orderService.createOrder({
        orderId: 'ORD-004A',
        productId: 'PROD-004',
        quantity: 1,
        amount: 30000,
        correlationId: corr1,
      }),
      orderService.createOrder({
        orderId: 'ORD-004B',
        productId: 'PROD-004',
        quantity: 1,
        amount: 30000,
        correlationId: corr2,
      }),
    ]);

    await waitForEvents(300);

    const orderA = orderService.getOrder('ORD-004A');
    const orderB = orderService.getOrder('ORD-004B');

    // 하나는 CONFIRMED, 하나는 CANCELLED
    const statuses = [orderA.status, orderB.status].sort();
    expect(statuses).toContain('CONFIRMED');
    expect(statuses).toContain('CANCELLED');

    // 재고는 0이어야 함
    const stock = inventoryService.getStock('PROD-004');
    expect(stock.quantity).toBe(0);
  });

  // ================================================================
  // 시나리오 5: SAGA 타임아웃 보상 트랜잭션
  // ================================================================
  test('시나리오 5: SAGA 타임아웃 - 단계 시간 초과 시 보상 트랜잭션 실행', async () => {
    const orchestrator = new SagaOrchestrator(bus, logger);
    const compensated = [];

    const saga = {
      name: 'order-saga-timeout',
      steps: [
        {
          name: 'reserve-inventory',
          execute: async (ctx) => {
            return { reserved: true };
          },
          compensation: {
            name: 'release-inventory',
            execute: async (ctx) => {
              compensated.push('inventory-released');
            },
          },
        },
        {
          name: 'process-payment',
          timeoutMs: 50, // 50ms 타임아웃
          execute: async (ctx) => {
            // 200ms 걸려서 타임아웃
            await new Promise((r) => setTimeout(r, 200));
            return { paid: true };
          },
          compensation: {
            name: 'refund-payment',
            execute: async (ctx) => {
              compensated.push('payment-refunded');
            },
          },
        },
      ],
    };

    const correlationId = generateCorrelationId();
    const result = await orchestrator.executeSaga(saga, { correlationId });

    // 보상 완료 상태
    expect(result.status).toBe('compensated');
    expect(result.error).toContain('timed out');

    // 역순 보상: reserve-inventory의 보상이 실행되어야 함
    expect(compensated).toContain('inventory-released');

    // 로그 확인
    const logs = logger.getByCorrelationId(correlationId);
    expect(logs.some((l) => l.event === 'saga.step.failed')).toBe(true);
    expect(logs.some((l) => l.event === 'saga.compensated')).toBe(true);
  });
});

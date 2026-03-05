/**
 * EventBus 단위 테스트
 */

const { EventBus } = require('../src/event-bus');

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  test('정확한 이벤트 구독 및 발행', async () => {
    const received = [];
    bus.subscribe('order.created', (data) => received.push(data));

    await bus.publish('order.created', { orderId: '1' });

    expect(received).toHaveLength(1);
    expect(received[0].orderId).toBe('1');
  });

  test('와일드카드 패턴 매칭', async () => {
    const received = [];
    bus.subscribePattern('order.*', (data) => received.push(data));

    await bus.publish('order.created', { orderId: '1' });
    await bus.publish('order.confirmed', { orderId: '1' });
    await bus.publish('payment.completed', { orderId: '1' });

    expect(received).toHaveLength(2);
  });

  test('일회성 구독 (subscribeOnce)', async () => {
    const received = [];
    bus.subscribeOnce('order.created', (data) => received.push(data));

    await bus.publish('order.created', { orderId: '1' });
    await bus.publish('order.created', { orderId: '2' });

    expect(received).toHaveLength(1);
    expect(received[0].orderId).toBe('1');
  });

  test('핸들러 에러 격리', async () => {
    const received = [];
    bus.subscribe('order.created', () => { throw new Error('fail'); });
    bus.subscribe('order.created', (data) => received.push(data));

    await bus.publish('order.created', { orderId: '1' });

    expect(received).toHaveLength(1);
  });

  test('구독 해제', async () => {
    const received = [];
    const handler = (data) => received.push(data);
    bus.subscribe('order.created', handler);

    await bus.publish('order.created', { orderId: '1' });
    bus.unsubscribe('order.created', handler);
    await bus.publish('order.created', { orderId: '2' });

    expect(received).toHaveLength(1);
  });

  test('이벤트 히스토리 기록', async () => {
    await bus.publish('order.created', { orderId: '1' });
    await bus.publish('payment.completed', { orderId: '1' });

    expect(bus.getHistory()).toHaveLength(2);
    expect(bus.getHistory('order')).toHaveLength(1);
  });

  test('구독 해제 반환 함수 사용', async () => {
    const received = [];
    const unsub = bus.subscribe('test.event', (data) => received.push(data));

    await bus.publish('test.event', { id: 1 });
    unsub();
    await bus.publish('test.event', { id: 2 });

    expect(received).toHaveLength(1);
  });
});

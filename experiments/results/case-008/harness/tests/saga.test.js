/**
 * SAGA Orchestrator 단위 테스트
 */

const { SagaOrchestrator, SagaTimeoutError } = require('../src/saga-orchestrator');
const { EventBus } = require('../src/event-bus');
const { Logger } = require('../src/utils/logger');

describe('SagaOrchestrator', () => {
  let bus, logger, orchestrator;

  beforeEach(() => {
    bus = new EventBus();
    logger = new Logger();
    orchestrator = new SagaOrchestrator(bus, logger);
  });

  test('모든 단계 성공 시 completed 상태', async () => {
    const saga = {
      name: 'test-saga',
      steps: [
        {
          name: 'step1',
          execute: async () => 'result1',
          compensation: { name: 'undo-step1', execute: async () => {} },
        },
        {
          name: 'step2',
          execute: async () => 'result2',
          compensation: { name: 'undo-step2', execute: async () => {} },
        },
      ],
    };

    const result = await orchestrator.executeSaga(saga, {});

    expect(result.status).toBe('completed');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].status).toBe('completed');
    expect(result.steps[1].status).toBe('completed');
  });

  test('단계 실패 시 보상 트랜잭션 역순 실행', async () => {
    const compensationOrder = [];

    const saga = {
      name: 'fail-saga',
      steps: [
        {
          name: 'step1',
          execute: async () => 'ok',
          compensation: {
            name: 'undo-step1',
            execute: async () => compensationOrder.push('undo1'),
          },
        },
        {
          name: 'step2',
          execute: async () => { throw new Error('step2 failed'); },
          compensation: {
            name: 'undo-step2',
            execute: async () => compensationOrder.push('undo2'),
          },
        },
      ],
    };

    const result = await orchestrator.executeSaga(saga, {});

    expect(result.status).toBe('compensated');
    // step2 실패 전까지 완료된 step1의 보상만 실행됨
    expect(compensationOrder).toEqual(['undo1']);
  });

  test('타임아웃 시 SagaTimeoutError 발생 및 보상', async () => {
    const compensated = [];

    const saga = {
      name: 'timeout-saga',
      steps: [
        {
          name: 'fast-step',
          execute: async () => 'ok',
          compensation: {
            name: 'undo-fast',
            execute: async () => compensated.push('undo-fast'),
          },
        },
        {
          name: 'slow-step',
          timeoutMs: 50,
          execute: () => new Promise((resolve) => setTimeout(resolve, 200)),
          compensation: {
            name: 'undo-slow',
            execute: async () => compensated.push('undo-slow'),
          },
        },
      ],
    };

    const result = await orchestrator.executeSaga(saga, {});

    expect(result.status).toBe('compensated');
    expect(result.error).toContain('timed out');
    expect(compensated).toContain('undo-fast');
  });

  test('correlation ID가 saga 상태에 포함', async () => {
    const saga = {
      name: 'id-saga',
      steps: [{ name: 'step1', execute: async () => 'ok' }],
    };

    const result = await orchestrator.executeSaga(saga, { correlationId: 'test-corr-123' });

    expect(result.correlationId).toBe('test-corr-123');
    expect(orchestrator.getSagaState('test-corr-123')).toBeTruthy();
  });

  test('로거에 SAGA 실행 이력 기록', async () => {
    const saga = {
      name: 'log-saga',
      steps: [
        {
          name: 'step1',
          execute: async () => 'ok',
          compensation: { name: 'undo-step1', execute: async () => {} },
        },
      ],
    };

    const result = await orchestrator.executeSaga(saga, { correlationId: 'log-test' });
    const logs = logger.getByCorrelationId('log-test');

    expect(logs.length).toBeGreaterThanOrEqual(2); // started + step.completed + completed
    expect(logs.some((l) => l.event === 'saga.started')).toBe(true);
    expect(logs.some((l) => l.event === 'saga.completed')).toBe(true);
  });
});

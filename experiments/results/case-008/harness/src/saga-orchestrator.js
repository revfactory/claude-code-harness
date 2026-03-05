/**
 * SAGA Orchestrator
 * 분산 트랜잭션 조율: 단계별 실행 + 보상 트랜잭션
 * 타임아웃: 각 단계 5초 제한
 */

const { generateCorrelationId } = require('./utils/correlation-id');

class SagaTimeoutError extends Error {
  constructor(stepName, timeoutMs) {
    super(`SAGA step '${stepName}' timed out after ${timeoutMs}ms`);
    this.name = 'SagaTimeoutError';
    this.stepName = stepName;
    this.timeoutMs = timeoutMs;
  }
}

class SagaOrchestrator {
  constructor(eventBus, logger) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.sagas = new Map(); // correlationId → SagaState
  }

  async executeSaga(sagaDefinition, context) {
    const correlationId = context.correlationId || generateCorrelationId();
    const state = {
      correlationId,
      steps: [],
      compensations: [],
      status: 'running',
      startedAt: Date.now(),
    };
    this.sagas.set(correlationId, state);

    if (this.logger) {
      this.logger.log(correlationId, 'saga.started', { definition: sagaDefinition.name });
    }

    for (const step of sagaDefinition.steps) {
      try {
        const timeoutMs = step.timeoutMs || 5000;
        const result = await Promise.race([
          this._executeStep(step, { ...context, correlationId }),
          this._timeout(timeoutMs, step.name),
        ]);

        state.steps.push({ step: step.name, status: 'completed', result });

        if (step.compensation) {
          state.compensations.unshift({ ...step.compensation, context: { ...context, correlationId } });
        }

        if (this.logger) {
          this.logger.log(correlationId, `saga.step.completed`, { step: step.name });
        }
      } catch (error) {
        state.steps.push({ step: step.name, status: 'failed', error: error.message });

        if (this.logger) {
          this.logger.log(correlationId, `saga.step.failed`, { step: step.name, error: error.message });
        }

        // 보상 트랜잭션 실행 (역순)
        for (const comp of state.compensations) {
          try {
            await this._executeCompensation(comp);
            if (this.logger) {
              this.logger.log(correlationId, `saga.compensation.completed`, { step: comp.name });
            }
          } catch (compError) {
            if (this.logger) {
              this.logger.log(correlationId, `saga.compensation.failed`, {
                step: comp.name,
                error: compError.message,
              });
            }
          }
        }

        state.status = 'compensated';
        state.completedAt = Date.now();
        state.error = error.message;

        if (this.logger) {
          this.logger.log(correlationId, 'saga.compensated', { error: error.message });
        }

        return state;
      }
    }

    state.status = 'completed';
    state.completedAt = Date.now();

    if (this.logger) {
      this.logger.log(correlationId, 'saga.completed', {});
    }

    return state;
  }

  async _executeStep(step, context) {
    return step.execute(context);
  }

  async _executeCompensation(comp) {
    return comp.execute(comp.context);
  }

  _timeout(ms, stepName) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new SagaTimeoutError(stepName, ms)), ms);
    });
  }

  getSagaState(correlationId) {
    return this.sagas.get(correlationId) || null;
  }

  clear() {
    this.sagas.clear();
  }
}

module.exports = { SagaOrchestrator, SagaTimeoutError };

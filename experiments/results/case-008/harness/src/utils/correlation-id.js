/**
 * Correlation ID 생성 유틸리티
 * 이벤트 흐름 추적을 위한 고유 ID 생성
 */

let counter = 0;

function generateCorrelationId(prefix = 'saga') {
  counter++;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}-${counter}`;
}

function resetCounter() {
  counter = 0;
}

module.exports = { generateCorrelationId, resetCounter };

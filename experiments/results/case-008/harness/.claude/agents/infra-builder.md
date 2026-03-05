# 인프라 구축 에이전트

## 역할
EventBus(pub/sub, 와일드카드, Promise.allSettled), CorrelationId, Logger 등 마이크로서비스 공통 인프라를 구현한다.

## 책임
- EventBus 구현
  - publish(eventType, payload) — 이벤트 발행
  - subscribe(pattern, handler) — 이벤트 구독 (와일드카드 패턴 지원: order.*, *.created)
  - unsubscribe(pattern, handler) — 구독 해제
  - Promise.allSettled 기반 핸들러 병렬 실행
  - 이벤트 히스토리 저장 (디버깅/리플레이 용도)
  - Dead letter queue — 처리 실패 이벤트 보관
- CorrelationId 유틸리티
  - 요청 단위 고유 ID 생성 (UUID v4)
  - 이벤트 체인 전체에 ID 전파
  - 상관 ID 기반 이벤트 추적
- Logger 유틸리티
  - 구조화된 로깅 (JSON 형식)
  - 로그 레벨 (DEBUG, INFO, WARN, ERROR)
  - CorrelationId 자동 포함
  - 타임스탬프 및 서비스명 포함
- 공통 타입/인터페이스 정의

## 도구
- Write — 소스 파일 생성
- Read — 기존 코드 참조
- Edit — 코드 수정
- Bash — 단위 테스트 실행

## 산출물
- `src/infra/event-bus.js` — EventBus 클래스
- `src/infra/correlation.js` — CorrelationId 생성/전파 유틸리티
- `src/infra/logger.js` — 구조화된 Logger
- `src/infra/types.js` — 공통 이벤트/메시지 타입 정의
- `tests/event-bus.test.js` — EventBus 단위 테스트

## 선행 조건
없음 (독립 실행 가능)

## 품질 기준
- EventBus 와일드카드 패턴이 정상 매칭됨
- 핸들러 에러가 다른 핸들러 실행을 차단하지 않음 (Promise.allSettled)
- CorrelationId가 이벤트 체인 전체에서 추적 가능
- Logger 출력이 JSON 파싱 가능한 형식
- 이벤트 히스토리에서 특정 correlationId로 필터링 가능
- Dead letter queue에 실패 이벤트와 에러 정보 저장됨

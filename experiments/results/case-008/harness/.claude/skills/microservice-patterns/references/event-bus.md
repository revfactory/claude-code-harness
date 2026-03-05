# EventBus 구현 패턴

## EventBus 클래스

```javascript
class EventBus {
  constructor() {
    this.handlers = new Map();      // event → Set<handler>
    this.wildcardHandlers = new Map(); // pattern → Set<handler>
  }

  subscribe(event, handler) { /* 정확한 이벤트 매칭 */ }
  subscribePattern(pattern, handler) { /* 와일드카드: 'order.*' */ }
  subscribeOnce(event, handler) { /* 일회성 구독 */ }

  async publish(event, data) {
    // 1. 정확한 매칭 핸들러 실행
    // 2. 와일드카드 매칭 핸들러 실행
    // 3. 비동기 핸들러는 Promise.allSettled로 처리
    // 4. 핸들러 에러가 다른 핸들러에 영향 주지 않도록 격리
  }

  unsubscribe(event, handler) { }
}
```

## 핵심 구현 사항

- `subscribe`: 정확한 이벤트 이름으로 구독
- `subscribePattern`: 와일드카드 패턴으로 구독 (예: `order.*`)
- `subscribeOnce`: 한 번만 실행 후 자동 해제
- `publish`: `Promise.allSettled`로 모든 핸들러를 병렬 실행, 개별 핸들러 에러 격리
- `unsubscribe`: 특정 핸들러 구독 해제

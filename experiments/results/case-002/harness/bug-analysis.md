# AsyncCache 레이스 컨디션 버그 분석

## 발견된 버그 목록

### Bug 1: 동일 키 동시 요청 시 fetchFn 중복 실행
- **원인**: `get()` 메서드에서 `pending` Map을 활용하지 않음. 두 요청이 거의 동시에 들어오면 둘 다 `cache.has(key)`가 false이므로 fetchFn이 두 번 호출됨.
- **영향**: 불필요한 네트워크 요청, 서버 부하, 비일관적 캐시 값
- **심각도**: 높음

### Bug 2: refresh 중 get이 stale 값을 반환하거나 별도 fetch 실행
- **원인**: `refresh()`가 캐시를 삭제한 후 fetch가 완료되기 전에 `get()`이 호출되면, get은 새로운 fetch를 시작함. refresh와 get이 각각 별도의 Promise로 동작.
- **영향**: 데이터 불일치, 중복 fetch
- **심각도**: 높음

### Bug 3: fetchFn 에러 시 pending 상태 미정리
- **원인**: pending Map 자체가 사용되지 않고 있으며, 에러 처리 로직이 없음. fetchFn이 에러를 던지면 cache에 저장되지 않지만 별도 정리 로직도 없음.
- **영향**: pending을 도입한 후 에러 시 정리하지 않으면 영구 대기 상태 발생 가능
- **심각도**: 높음

## 수정 전략
1. `_fetch()` 헬퍼 메서드를 추출하여 pending Map에 Promise를 저장하고 중복 방지
2. try/finally 패턴으로 에러 시에도 pending 정리 보장
3. refresh 시에도 pending Map을 활용하여 get이 새 값을 대기하도록 구현

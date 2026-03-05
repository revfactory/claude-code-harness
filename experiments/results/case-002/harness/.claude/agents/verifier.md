# 검증자 에이전트

## 역할
Jest 테스트로 AsyncCache 버그 수정을 검증하고 동시성 시나리오 및 회귀 테스트를 수행한다.

## 책임
- Jest 테스트 환경 구성
- 기본 캐시 동작 테스트 (get, set, delete, TTL)
- 동시성 시나리오 테스트 (동일 키 동시 요청 → 단일 fetch 확인)
- 에러 발생 시 pending 정리 테스트
- 캐시 미스/히트 시나리오 테스트
- 회귀 테스트 (수정 전 실패하던 케이스가 통과하는지 확인)
- 경계값 테스트 (빈 키, null 값, 대량 동시 요청)

## 도구
- Write (테스트 파일 생성)
- Edit (테스트 코드 수정)
- Read (수정된 AsyncCache 코드 확인)
- Bash (jest 실행, 테스트 결과 확인)
- Grep (테스트 대상 메서드 검색)

## 산출물
- `tests/async-cache.test.js` (통합 테스트)
- `tests/concurrency.test.js` (동시성 전용 테스트)
- `tests/error-handling.test.js` (에러 핸들링 테스트)
- `tests/regression.test.js` (회귀 테스트)

## 선행 조건
- fixer 에이전트 완료 (수정된 코드 필요)

## 품질 기준
- [ ] 모든 테스트가 통과한다 (`npm test` 성공)
- [ ] 동시성 테스트에서 fetch 호출이 1회만 발생함을 검증한다
- [ ] 에러 후 재시도 시 정상 동작함을 검증한다
- [ ] 최소 3개의 동시성 시나리오가 테스트된다
- [ ] 테스트가 타이밍에 의존하지 않고 결정적(deterministic)이다
- [ ] 회귀 테스트가 이전 버그 시나리오를 재현한다

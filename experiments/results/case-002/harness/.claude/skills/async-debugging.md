# Async Debugging Skill

비동기 코드의 레이스 컨디션 및 동시성 버그를 분석하고 수정하는 스킬

## Trigger Conditions
- 비동기 버그 수정 요청 시
- 레이스 컨디션, 동시성 문제 발견 시

## Instructions

### 버그 분석 프로세스
1. **식별**: 코드에서 공유 상태에 대한 비동기 접근을 모두 찾기
2. **시나리오 도출**: 어떤 타이밍에 문제가 발생하는지 시퀀스 작성
3. **영향 평가**: 각 버그의 심각도와 발생 가능성 평가
4. **문서화**: bug-analysis.md에 분석 결과 기록

### 수정 패턴
- **Deduplication**: pending Map에 Promise를 저장하여 동일 키 요청 중복 방지
- **Resource Cleanup**: try/finally로 에러 시에도 pending 상태 정리 보장
- **Atomic Operations**: 캐시 삭제와 새 값 설정을 원자적으로 처리
- **Helper Extraction**: 공통 fetch 로직을 _fetch() 헬퍼로 추출하여 DRY

### 테스트 패턴 (동시성)
```javascript
// 동시 요청 테스트
const [r1, r2] = await Promise.all([cache.get('k', fn), cache.get('k', fn)]);
// fetchFn 호출 횟수 검증: 1회만 호출되어야 함

// refresh 중 get 테스트
const refreshPromise = cache.refresh('k', slowFn);
const getPromise = cache.get('k', fn);
// getPromise는 refresh 완료 후의 새 값을 반환해야 함

// 에러 후 정리 테스트
await cache.get('k', errorFn).catch(() => {});
// pending이 정리되어 다음 요청이 정상 동작해야 함
```

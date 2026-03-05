---
name: async-debugging
description: Analyze and fix race conditions and concurrency bugs in async code. Use when debugging async bugs, fixing race conditions, resolving concurrency issues, or when shared state is accessed by multiple async operations.
---

# Async Debugging

## 버그 분석 워크플로우

1. **식별**: 코드에서 공유 상태에 대한 비동기 접근을 모두 찾기
2. **시나리오 도출**: 어떤 타이밍에 문제가 발생하는지 시퀀스 작성
3. **영향 평가**: 각 버그의 심각도와 발생 가능성 평가
4. **문서화**: bug-analysis.md에 분석 결과 기록

## 수정 원칙

- **Deduplication**: pending Map에 Promise를 저장하여 동일 키 요청 중복 방지
- **Resource Cleanup**: try/finally로 에러 시에도 pending 상태 정리 보장
- **Atomic Operations**: 캐시 삭제와 새 값 설정을 원자적으로 처리
- **Helper Extraction**: 공통 fetch 로직을 _fetch() 헬퍼로 추출하여 DRY

## 수정 전 반드시

- 버그를 분석하고 문서화할 것
- 중복 코드는 헬퍼 메서드로 추출할 것
- 테스트는 동시성 시나리오를 반드시 포함할 것

상세 코드 패턴은 `references/patterns.md` 참조.

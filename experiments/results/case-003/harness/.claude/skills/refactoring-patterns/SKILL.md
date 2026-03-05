---
name: refactoring-patterns
description: Systematic code refactoring guide with design patterns. Use when refactoring spaghetti code, applying Strategy pattern to conditional branches, extracting functions by SRP, or replacing magic numbers with named constants.
---

# Refactoring Patterns

## 리팩토링 워크플로우

### 1. 분석
- 원본 코드의 입출력 동작을 완전히 이해
- 매직 넘버, 중복 코드, 긴 조건 분기 식별
- 각 코드 블록의 책임 파악

### 2. 설계
- 매직 넘버 -> 명명된 상수 (constants.js)
- 조건 분기(if/else, switch) -> 전략 패턴 (pricingStrategies.js)
- 하나의 큰 함수 -> SRP 기반 단일 책임 함수 분리
- 팩토리 함수로 전략 객체 생성

### 3. 구현
- 상수 정의 파일 분리
- 전략 클래스 구현 (base + 구체 전략)
- 오케스트레이터 함수에서 전략 호출
- SRP 함수 분리:
  - calculateLineItem() - 단일 항목 계산
  - applyDiscount() - 할인 적용
  - calculateTax() - 세금 계산
  - applyBulkDiscount() - 대량 할인
  - updateHistory() - 이력 갱신
  - calculateOrder() - 오케스트레이터

### 4. 테스트
- 원본 vs 리팩토링 동일성 테스트 (동일 입력 -> 동일 출력)
- 각 전략별 단위 테스트
- 경계값 테스트 (수량 50, 51, 100, 101)
- 엣지 케이스 (빈 배열, 할인 0%, 세금 0%)

상세 코드 패턴은 `references/patterns.md` 참조.

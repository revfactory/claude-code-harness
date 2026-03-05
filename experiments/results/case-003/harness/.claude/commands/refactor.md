# Refactor

코드를 체계적으로 리팩토링합니다.

## Arguments
$ARGUMENTS - 대상 파일 또는 함수명

## Instructions

1. **원본 보존**: original.js로 원본 코드를 저장하세요.
2. **분석**: refactoring-patterns 스킬에 따라 리팩토링 포인트를 식별하세요.
3. **상수 추출**: 모든 매직 넘버를 constants.js로 분리하세요.
4. **전략 패턴**: 조건 분기를 pricingStrategies.js의 전략 클래스로 분리하세요.
5. **함수 분리**: SRP에 따라 calculator.js에 순수 함수로 분리하세요.
6. **테스트**: 원본 동일성 테스트 + 단위 테스트를 작성하고 실행하세요.

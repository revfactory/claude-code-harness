# datekit README 작성 프로젝트

datekit 라이브러리의 완전한 README.md를 작성하는 프로젝트입니다.

## API 정확성 규칙 (최우선)
- 모든 함수 시그니처를 정확하게 기재
- 선택적 파라미터는 반드시 명시
- format 패턴 토큰을 전수 나열 (YYYY, MM, DD, HH, mm, ss, SSS, ddd, dddd, MMM, MMMM, A, a, Z, ZZ, X 등)
- 반환값의 타입과 엣지 케이스 명시 (음수 반환 등)
- 예제 코드는 실제 동작과 일치하도록 영어 출력 기준

## 문서 구조
1. 배지 (npm, size, license, TS)
2. 한줄 소개 + 핵심 특징
3. 설치 (npm/yarn/pnpm)
4. Quick Start
5. API 레퍼런스 (함수별: 시그니처, 파라미터 테이블, 반환값, 예제)
6. TypeScript
7. 브라우저 (ESM + UMD)
8. 기여 가이드
9. 라이선스

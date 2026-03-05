# 비교 분석 프레임워크

## 9개 비교 항목 상세

### 1. 핵심 개념 및 멘탈 모델
- 각 라이브러리의 상태 관리 철학
- 데이터 흐름 패턴 (단방향/양방향/구독 기반)

### 2. 코드 예제
- 동일 카운터 앱: increment, decrement, reset
- 동일 TODO 앱: add, toggle, remove, filter(all/active/completed)

### 3. 번들 사이즈
- bundlephobia 기준 minified+gzipped 수치

### 4. 학습 곡선
- 1-5 등급 (1=쉬움, 5=어려움)

### 5. TypeScript 지원도
- 타입 추론 품질, 제네릭 지원, DX

### 6. DevTools
- 브라우저 확장, 시간 여행 디버깅, 상태 검사

### 7. SSR 호환성
- Next.js/Remix 등과의 통합 수준

### 8. 성능 (리렌더링 최적화)
- 선택적 구독, 메모이제이션, 프록시 기반 등

### 9. 커뮤니티
- GitHub stars, npm weekly downloads, 유지보수 상태

## 비교 매트릭스 템플릿

```markdown
| 항목 | Lib1 | Lib2 | Lib3 | Lib4 | Lib5 |
|------|------|------|------|------|------|
| 번들 사이즈 | X kB | X kB | X kB | X kB | X kB |
| npm 주간 DL | Xm | Xm | Xm | Xm | Xm |
| GitHub Stars | Xk | Xk | Xk | Xk | Xk |
| 학습 곡선 | X/5 | X/5 | X/5 | X/5 | X/5 |
| TS 지원 | A-F | A-F | A-F | A-F | A-F |
| DevTools | A-F | A-F | A-F | A-F | A-F |
| SSR | A-F | A-F | A-F | A-F | A-F |
| 성능 | A-F | A-F | A-F | A-F | A-F |
| 커뮤니티 | A-F | A-F | A-F | A-F | A-F |
```

## 예제 코드 통일 규칙

- 모든 라이브러리의 예제는 동일한 기능을 구현
- 카운터: increment, decrement, reset
- TODO: add, toggle, remove, filter(all/active/completed)
- TypeScript 사용
- 함수형 컴포넌트

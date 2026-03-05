# Tech Comparison Skill

기술 라이브러리/프레임워크 비교 분석 가이드

## Trigger Conditions
- 기술 비교 분석, 라이브러리 비교 요청 시

## Instructions

### 비교 문서 구조
```markdown
# {주제} 비교 분석

## 종합 비교 매트릭스
| 항목 | Lib1 | Lib2 | ... |
(정량: 수치, 정성: A-F 등급)

## 개별 라이브러리 분석
### {라이브러리명}
- 핵심 개념
- 강점/약점
- 적합한 사용 사례

## 코드 비교
(동일 기능을 각 라이브러리로 구현)

## 추천 가이드
### 프로젝트 규모별
### 유형별
### 팀 상황별
```

### 정량 데이터 기준
- 번들 사이즈: bundlephobia 기준 minified+gzipped
- npm 다운로드: 주간 다운로드 수
- GitHub stars: 현재 시점
- 첫 릴리스 연도

### 등급 기준 (A-F)
- A: 최고 수준, 기준 이상
- B: 우수, 대부분의 요구 충족
- C: 보통, 기본 기능은 갖춤
- D: 미흡, 제한적
- F: 사용 불가/중단됨

### 예제 코드 통일 규칙
모든 라이브러리의 예제는 동일한 기능을 구현:
- 카운터: increment, decrement, reset
- TODO: add, toggle, remove, filter(all/active/completed)
- TypeScript 사용
- 함수형 컴포넌트

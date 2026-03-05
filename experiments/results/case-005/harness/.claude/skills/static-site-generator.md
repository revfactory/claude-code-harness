# Static Site Generator Skill

마크다운 기반 정적 사이트 생성기 구현 가이드

## Trigger Conditions
- 정적 사이트 생성기, 블로그 생성기 구현 시

## Instructions

### 마크다운 변환 규칙
지원할 마크다운 문법 (우선순위순):
1. 헤딩 (# ~ ######)
2. 코드 블록 (``` + 언어 지정)
3. 인라인 코드 (`code`)
4. 볼드 (**text**)
5. 이탤릭 (*text*)
6. 링크 ([text](url))
7. 이미지 (![alt](src))
8. 순서 있는/없는 리스트
9. 인용 (> text)
10. 수평선 (---)
11. 단락 (빈 줄 구분)

### 템플릿 엔진 구현
```
{{ variable }}           - 변수 치환
{{#each items}} ... {{/each}} - 반복
{{#if condition}} ... {{/if}} - 조건
```

### 빌드 파이프라인
1. posts/ 내 *.md 파일 스캔
2. 각 파일에서 frontmatter 추출 + 마크다운 파싱
3. 날짜순 정렬
4. 태그 수집 및 그룹화
5. 개별 포스트 HTML 생성 → dist/posts/
6. 인덱스 페이지 생성 → dist/index.html
7. 태그별 페이지 생성 → dist/tags/
8. 태그 인덱스 생성 → dist/tags.html
9. CSS 복사 → dist/style.css

### 테스트 전략
- frontmatter 파싱 단위 테스트
- 마크다운 변환 단위 테스트 (각 문법별)
- 템플릿 엔진 단위 테스트
- 전체 빌드 통합 테스트

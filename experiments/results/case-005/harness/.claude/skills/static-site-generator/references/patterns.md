# Static Site Generator - Code Patterns

## 마크다운 변환 규칙

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

주의: 코드 블록 내부의 마크다운 문법은 변환하지 않아야 한다. 코드 블록을 먼저 처리하여 보호한 후 나머지 변환을 적용한다.

## 템플릿 엔진 패턴

```
{{ variable }}                     - 변수 치환
{{#each items}} ... {{/each}}     - 반복
{{#if condition}} ... {{/if}}     - 조건
```

구현 시 정규식으로 토큰을 파싱하고, 중첩 블록은 재귀적으로 처리한다.

```javascript
// 변수 치환
function renderVariable(template, data) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined ? data[key] : '';
  });
}

// each 블록
function renderEach(template, data) {
  return template.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, key, body) => {
      const items = data[key] || [];
      return items.map(item => render(body, item)).join('');
    }
  );
}
```

## 테스트 전략

### 단위 테스트
- frontmatter 파싱: YAML 메타데이터 추출 정확성
- 마크다운 변환: 각 문법별 개별 테스트
- 템플릿 엔진: 변수 치환, each, if 각각 테스트
- 코드 하이라이팅: 언어 감지 및 토큰화

### 통합 테스트
- 전체 빌드 파이프라인: posts/ -> dist/ 변환 검증
- 생성된 HTML 구조 검증
- 태그 페이지 생성 확인
- CSS 복사 확인

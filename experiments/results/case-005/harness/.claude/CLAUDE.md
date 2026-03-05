# 마크다운 블로그 생성기 프로젝트

마크다운 파일을 HTML 정적 사이트로 변환하는 CLI 도구입니다.

## 아키텍처
```
bin/
  blog.js            - CLI 엔트리포인트
src/
  builder.js         - 빌드 오케스트레이터
  markdown.js        - 마크다운→HTML 변환기
  frontmatter.js     - YAML frontmatter 파서
  highlight.js       - 코드 구문 하이라이팅
  template.js        - 템플릿 엔진 ({{var}}, {{#each}}, {{#if}})
  new-post.js        - 새 포스트 생성
  server.js          - 로컬 개발 서버
templates/
  layout.html        - 기본 레이아웃
  post.html          - 포스트 템플릿
  index.html         - 인덱스 템플릿
  tag.html           - 태그 페이지 템플릿
```

## 규칙
- 외부 의존성 0개 (순수 Node.js)
- 각 모듈은 독립적으로 테스트 가능해야 함
- CSS는 별도 파일로 분리 (dist/style.css)
- 반응형 디자인 적용

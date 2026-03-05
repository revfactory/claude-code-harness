---
name: static-site-generator
description: Build a markdown-based static site generator with zero dependencies. Use when implementing a blog generator, markdown-to-HTML converter, static site build pipeline, or template engine from scratch using pure Node.js.
---

# Static Site Generator

## 모듈 아키텍처

```
bin/
  blog.js            - CLI 엔트리포인트
src/
  builder.js         - 빌드 오케스트레이터
  markdown.js        - 마크다운->HTML 변환기
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

## 빌드 파이프라인 워크플로우

1. posts/ 내 *.md 파일 스캔
2. 각 파일에서 frontmatter 추출 + 마크다운 파싱
3. 날짜순 정렬
4. 태그 수집 및 그룹화
5. 개별 포스트 HTML 생성 -> dist/posts/
6. 인덱스 페이지 생성 -> dist/index.html
7. 태그별 페이지 생성 -> dist/tags/
8. 태그 인덱스 생성 -> dist/tags.html
9. CSS 복사 -> dist/style.css

## 핵심 제약

- 외부 의존성 0개 (순수 Node.js)
- 각 모듈은 독립적으로 테스트 가능해야 함
- CSS는 별도 파일로 분리
- 반응형 디자인 적용

상세 변환 규칙과 테스트 전략은 `references/patterns.md` 참조.

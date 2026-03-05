# Build Blog

블로그 생성기를 체계적으로 구현합니다.

## Instructions

1. static-site-generator 스킬의 아키텍처에 따라 모듈별로 구현하세요.
2. 구현 순서:
   - src/frontmatter.js (독립 모듈)
   - src/markdown.js (독립 모듈)
   - src/highlight.js (독립 모듈)
   - src/template.js (독립 모듈)
   - templates/*.html (템플릿 파일들)
   - src/builder.js (위 모듈 조합)
   - src/new-post.js (포스트 생성)
   - src/server.js (개발 서버)
   - bin/blog.js (CLI 진입점)
3. 각 모듈별 단위 테스트를 작성하세요.
4. 샘플 포스트 3개를 생성하고 빌드를 실행하여 검증하세요.

# CLI 빌더 에이전트

## 역할
build, new, serve CLI 명령어와 builder, server, new-post 모듈을 구현한다.

## 책임
- **build 명령어**: 마크다운 포스트들을 HTML로 빌드하여 output 디렉토리에 생성
- **new 명령어**: 새 블로그 포스트 마크다운 파일 생성 (frontmatter 템플릿 포함)
- **serve 명령어**: 로컬 개발 서버 실행 (정적 파일 서빙, 라이브 리로드 선택)
- **builder 모듈**: 빌드 파이프라인 (파일 탐색 → 파싱 → 변환 → 출력)
- **server 모듈**: HTTP 서버 (정적 파일 서빙)
- **new-post 모듈**: 포스트 스캐폴딩 생성
- CLI 인자 파싱 (commander 또는 직접 구현)
- 도움말 및 버전 정보 출력

## 도구
- Write (CLI 및 모듈 코드 생성)
- Edit (코드 수정)
- Read (core-builder 모듈 API 확인)
- Bash (CLI 명령어 실행 테스트)
- Grep (모듈 의존성 검색)
- Glob (파일 구조 확인)

## 산출물
- `src/builder.js` (빌드 파이프라인)
- `src/server.js` (개발 서버)
- `src/new-post.js` (새 포스트 생성기)
- `src/cli.js` (CLI 인자 파싱 및 명령어 라우팅)
- `bin/blog-cli.js` 업데이트 (CLI 엔트리포인트 연결)

## 선행 조건
- core-builder 에이전트 완료 (핵심 모듈 필요)

## 품질 기준
- [ ] `blog-cli build`가 마크다운 파일을 HTML로 변환한다
- [ ] `blog-cli new "제목"`이 올바른 frontmatter와 함께 파일을 생성한다
- [ ] `blog-cli serve`가 로컬 서버를 시작한다
- [ ] `blog-cli --help`가 사용법을 출력한다
- [ ] `blog-cli --version`이 버전을 출력한다
- [ ] 잘못된 명령어에 대해 도움말을 표시한다
- [ ] 빌드 결과물이 유효한 HTML이다

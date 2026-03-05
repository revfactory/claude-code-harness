# 테스터 에이전트

## 역할
단위 테스트와 통합 테스트를 작성하여 마크다운 변환 및 템플릿 엔진을 검증한다.

## 책임
- **단위 테스트**:
  - frontmatter 파서 테스트 (유효/무효 YAML, 다양한 필드)
  - markdown 변환기 테스트 (각 문법 요소별)
  - highlight 모듈 테스트 (언어별 구문 강조)
  - template 엔진 테스트 (변수 치환, 반복문, 조건문)
  - new-post 생성기 테스트
- **통합 테스트**:
  - build 명령어 E2E 테스트 (입력 마크다운 → 출력 HTML)
  - 전체 파이프라인 테스트 (frontmatter + markdown + highlight + template)
- Jest 테스트 환경 설정
- 테스트 픽스처(fixture) 마크다운 파일 준비

## 도구
- Write (테스트 파일 및 픽스처 생성)
- Edit (테스트 코드 수정)
- Read (구현 코드 확인)
- Bash (jest 실행, 테스트 결과 확인)
- Grep (테스트 대상 함수 검색)
- Glob (파일 구조 확인)

## 산출물
- `tests/frontmatter.test.js` (frontmatter 파서 테스트)
- `tests/markdown.test.js` (마크다운 변환 테스트)
- `tests/highlight.test.js` (구문 강조 테스트)
- `tests/template.test.js` (템플릿 엔진 테스트)
- `tests/build.integration.test.js` (빌드 통합 테스트)
- `tests/fixtures/` (테스트용 마크다운 파일)
- `jest.config.js` (Jest 설정)

## 선행 조건
- cli-builder 에이전트 완료 (전체 모듈 구현 필요)

## 품질 기준
- [ ] 모든 테스트가 통과한다
- [ ] 각 핵심 모듈(frontmatter, markdown, highlight, template)에 대한 테스트가 존재한다
- [ ] 통합 테스트가 전체 빌드 파이프라인을 검증한다
- [ ] 엣지케이스 (빈 파일, 잘못된 frontmatter, 지원하지 않는 마크다운 문법) 테스트 포함
- [ ] 테스트 커버리지 80% 이상 달성
- [ ] 테스트가 외부 상태에 의존하지 않고 독립적이다

# 코어 빌더 에이전트

## 역할
frontmatter, markdown, highlight, template 핵심 모듈을 구현한다.

## 책임
- **frontmatter 모듈**: YAML frontmatter 파싱 (title, date, tags, description 추출)
- **markdown 모듈**: Markdown → HTML 변환 (헤딩, 리스트, 코드블록, 링크, 이미지, 강조)
- **highlight 모듈**: 코드 블록 구문 강조 (언어별 토큰화 및 CSS 클래스 적용)
- **template 모듈**: 템플릿 엔진 구현 (변수 치환, 반복문, 조건문)
- 각 모듈의 공개 API 정의 및 export

## 도구
- Write (모듈 소스 코드 생성)
- Edit (코드 수정)
- Read (아키텍트의 스캐폴딩 및 설정 확인)
- Bash (모듈 동작 확인, Node.js로 실행 테스트)
- Grep (의존성 및 패턴 검색)

## 산출물
- `src/frontmatter.js` (YAML frontmatter 파서)
- `src/markdown.js` (Markdown → HTML 변환기)
- `src/highlight.js` (코드 구문 강조기)
- `src/template.js` (템플릿 엔진)
- `src/index.js` (모듈 통합 export)

## 선행 조건
- architect 에이전트 완료 (디렉토리 구조 및 package.json 필요)

## 품질 기준
- [ ] frontmatter가 YAML 메타데이터를 정확히 파싱한다
- [ ] markdown 변환이 주요 문법(헤딩, 리스트, 코드, 링크)을 지원한다
- [ ] highlight가 최소 3개 언어(js, python, html)를 지원한다
- [ ] template 엔진이 변수 치환 및 반복문을 처리한다
- [ ] 각 모듈이 독립적으로 import 가능하다
- [ ] 잘못된 입력에 대해 명확한 에러 메시지를 반환한다

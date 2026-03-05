# 아키텍트 에이전트

## 역할
Express TODO REST API의 MVC 구조를 설계하고 프로젝트 스캐폴딩을 생성한다.

## 책임
- MVC(Model-View-Controller) 디렉토리 구조 설계 및 생성
- `package.json` 초기화 및 의존성 정의 (express, dotenv, uuid 등)
- `src/` 하위 routes/, controllers/, models/, middlewares/ 폴더 생성
- 진입점 `src/app.js` 및 `src/server.js` 스캐폴딩
- `.env.example`, `.gitignore` 등 프로젝트 설정 파일 생성
- ESLint/Prettier 기본 설정 (선택)

## 도구
- Bash (npm init, mkdir, 디렉토리 구조 생성)
- Write (package.json, 설정 파일, 스캐폴딩 코드 작성)
- Read (기존 파일 확인)
- Glob (기존 구조 탐색)

## 산출물
- `package.json`
- `src/app.js` (Express 앱 설정, 미들웨어 바인딩)
- `src/server.js` (서버 시작 진입점)
- `src/routes/` 디렉토리
- `src/controllers/` 디렉토리
- `src/models/` 디렉토리
- `src/middlewares/` 디렉토리
- `.env.example`
- `.gitignore`

## 선행 조건
없음 (독립 실행 가능)

## 품질 기준
- [ ] `npm install`이 에러 없이 완료된다
- [ ] MVC 각 계층의 디렉토리가 존재한다
- [ ] `src/app.js`가 Express 인스턴스를 export한다
- [ ] package.json에 start, dev, test 스크립트가 정의되어 있다
- [ ] .gitignore에 node_modules, .env가 포함되어 있다

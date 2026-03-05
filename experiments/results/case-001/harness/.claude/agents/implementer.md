# 구현자 에이전트

## 역할
TODO REST API의 라우트, 컨트롤러, 모델, 미들웨어 코드를 구현한다.

## 책임
- TODO 모델 구현 (인메모리 저장소, CRUD 메서드)
- TODO 컨트롤러 구현 (GET/POST/PUT/PATCH/DELETE 핸들러)
- RESTful 라우트 정의 (`/api/todos`)
- 에러 핸들링 미들웨어 구현
- 입력 유효성 검증 미들웨어 구현
- 요청 로깅 미들웨어 구현
- HTTP 상태 코드 적절히 반환 (200, 201, 204, 400, 404, 500)

## 도구
- Write (소스 코드 파일 생성)
- Edit (기존 코드 수정)
- Read (아키텍트가 생성한 스캐폴딩 확인)
- Bash (코드 실행 및 동작 확인)
- Glob (파일 구조 탐색)

## 산출물
- `src/models/todo.js` (TODO 데이터 모델)
- `src/controllers/todoController.js` (CRUD 핸들러)
- `src/routes/todoRoutes.js` (라우트 정의)
- `src/middlewares/errorHandler.js` (글로벌 에러 핸들러)
- `src/middlewares/validateTodo.js` (입력 검증)
- `src/middlewares/logger.js` (요청 로깅)

## 선행 조건
- architect 에이전트 완료 (프로젝트 구조 및 package.json 필요)

## 품질 기준
- [ ] 모든 CRUD 엔드포인트가 정상 동작한다 (GET, POST, PUT, PATCH, DELETE)
- [ ] 존재하지 않는 TODO 요청 시 404를 반환한다
- [ ] 필수 필드 누락 시 400을 반환한다
- [ ] 응답 형식이 일관된 JSON 구조이다
- [ ] 에러 핸들링이 모든 라우트에 적용된다
- [ ] 코드에 하드코딩된 값이 없다

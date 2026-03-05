---
name: express-api-design
description: Express.js REST API design and implementation guide. Use when implementing REST API endpoints, creating Express routes, or setting up API project structure with MVC pattern.
---

# Express API Design

## 프로젝트 구조

```
src/
  app.js              - Express 앱 설정, 미들웨어 등록, 라우트 마운트
  routes/
    {resource}Routes.js  - 라우트 정의 (HTTP 메서드 + 경로)
  controllers/
    {resource}Controller.js - 비즈니스 로직
  models/
    {resource}Store.js   - 데이터 모델 및 CRUD 연산
  middleware/
    validate.js         - 입력 유효성 검사 미들웨어
    errorHandler.js     - 글로벌 에러 핸들링
```

## REST 규칙

- GET /resources - 목록 조회 -> 200
- GET /resources/:id - 단건 조회 -> 200 / 404
- POST /resources - 생성 -> 201 / 400
- PUT /resources/:id - 수정 -> 200 / 400 / 404
- DELETE /resources/:id - 삭제 -> 200 / 404

## 핵심 원칙

1. 모든 라우트는 controllers를 통해 처리
2. 에러는 글로벌 에러 핸들러로 전파 (컨트롤러에서 throw)
3. 입력 유효성 검사는 미들웨어에서 처리하여 재사용
4. 일관된 에러 응답 형식: `{ error: "메시지" }`
5. JSON 파싱 에러 별도 처리
6. 데이터 모델은 클래스 기반 싱글턴 스토어로 구현
7. 반환 시 스프레드 복사본 사용하여 불변성 보장
8. 자동 ID 생성 (auto-increment) 및 createdAt 자동 설정

상세 코드 패턴은 `references/patterns.md` 참조.

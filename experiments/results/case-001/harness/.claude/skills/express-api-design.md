# Express API Design Skill

Express.js REST API 설계 및 구현 가이드

## Trigger Conditions
- REST API 구현 요청 시
- Express 라우트 작성 시

## Instructions

### 프로젝트 구조 (필수)
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

### REST 규칙
- GET /resources - 목록 조회 → 200
- GET /resources/:id - 단건 조회 → 200 / 404
- POST /resources - 생성 → 201 / 400
- PUT /resources/:id - 수정 → 200 / 400 / 404
- DELETE /resources/:id - 삭제 → 200 / 404

### 유효성 검사 패턴
- 미들웨어로 분리하여 재사용
- ID 파라미터: 정수 여부, 양수 여부 검증
- Body 필드: 필수 필드 존재, 빈 문자열 차단, 타입 검증

### 에러 핸들링 패턴
- 컨트롤러에서 throw → 글로벌 에러 핸들러에서 catch
- JSON 파싱 에러 별도 처리
- 일관된 에러 응답 형식: { error: "메시지" }

### 데이터 모델 패턴
- 클래스 기반 싱글턴 스토어
- 불변성: 반환 시 스프레드 복사본 사용
- 자동 ID 생성 (auto-increment)
- createdAt 자동 설정

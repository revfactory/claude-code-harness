# TODO REST API 프로젝트

Express.js 기반 TODO REST API 프로젝트입니다.

## 아키텍처
- MVC 패턴 (Model-View-Controller)
- src/models/ - 데이터 모델 및 저장소
- src/controllers/ - 요청/응답 처리 로직
- src/routes/ - 라우트 정의
- src/middleware/ - 공통 미들웨어 (유효성 검사, 에러 핸들링)

## 규칙
- 모든 라우트는 controllers를 통해 처리
- 에러는 글로벌 에러 핸들러로 전파
- 입력 유효성 검사는 미들웨어에서 처리
- HTTP 상태 코드: 200(성공), 201(생성), 400(잘못된 요청), 404(미발견)

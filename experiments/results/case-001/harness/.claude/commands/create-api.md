# Create REST API

REST API를 체계적으로 생성합니다.

## Arguments
$ARGUMENTS - 리소스명 (예: todo, user, post)

## Instructions

1. **구조 생성**: express-api-design 스킬의 프로젝트 구조에 따라 디렉토리와 파일을 생성하세요.

2. **순서**: 아래 순서대로 파일을 작성하세요:
   - package.json (express 의존성)
   - src/models/{resource}Store.js (데이터 모델)
   - src/middleware/validate.js (유효성 검사)
   - src/middleware/errorHandler.js (에러 핸들링)
   - src/controllers/{resource}Controller.js (비즈니스 로직)
   - src/routes/{resource}Routes.js (라우트)
   - src/app.js (앱 조립)

3. **검증**: 모든 파일 작성 후 서버가 정상 기동되는지 확인하세요.

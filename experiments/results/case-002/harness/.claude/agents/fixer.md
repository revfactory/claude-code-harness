# 수정자 에이전트

## 역할
AsyncCache의 레이스 컨디션 버그를 _fetch() 헬퍼 추출과 try/finally 패턴으로 수정한다.

## 책임
- `_fetch()` 내부 헬퍼 메서드 추출 (캐시 조회 → fetch → 저장 로직 분리)
- pending Promise 맵을 도입하여 동일 키에 대한 중복 fetch 방지
- `try/finally` 패턴으로 에러 발생 시에도 pending 상태 정리 보장
- 캐시 TTL(만료) 로직이 있다면 정합성 유지
- 기존 API 인터페이스 변경 없이 내부 구현만 수정

## 도구
- Read (기존 AsyncCache 코드 읽기)
- Edit (코드 수정)
- Write (필요시 새 파일 생성)
- Bash (수정 후 동작 확인)
- Grep (관련 코드 패턴 검색)

## 산출물
- 수정된 `async-cache.js` (또는 해당 소스 파일)
  - `_fetch()` 헬퍼 메서드
  - pending Promise 관리 로직
  - try/finally 에러 안전 패턴

## 선행 조건
- analyzer 에이전트 완료 (버그 원인 파악 필요)

## 품질 기준
- [ ] 동일 키에 대한 동시 요청이 단일 fetch로 병합된다
- [ ] fetch 실패 시 pending 상태가 정리된다 (메모리 누수 없음)
- [ ] 기존 공개 API (get, set, delete 등) 시그니처가 변경되지 않았다
- [ ] try/finally 패턴이 모든 비동기 경로에 적용되었다
- [ ] 코드가 명확한 주석과 함께 가독성이 향상되었다

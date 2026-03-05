# 프로젝션 빌더 에이전트

## 역할
읽기 모델 프로젝션과 쿼리 API를 구현한다.

## 책임
- Projection 기반 클래스 구현
  - 이벤트 핸들러 등록
  - 읽기 모델 갱신
  - 재구축 (전체 이벤트 재생)
- 3가지 프로젝션 구현
  - AccountBalanceView: 계좌별 잔액/상태
  - TransactionHistoryView: 계좌별 거래 내역
  - TransferStatusView: 이체 진행 상태
- Repository 구현
  - Aggregate 로딩 (스냅샷 + 이벤트)
  - Aggregate 저장 (이벤트 + 자동 스냅샷)

## 도구
- Write — 소스 코드 생성
- Read — event-store, aggregate 참조
- Bash — 테스트 실행

## 산출물
- `src/framework/projection.js`
- `src/framework/repository.js`
- `src/projections/account-balance.js`
- `src/projections/transaction-history.js`
- `src/projections/transfer-status.js`
- `tests/projection.test.js`

## 선행 조건
- event-store-builder 에이전트 완료

## 품질 기준
- 프로젝션 재구축 후 원본과 동일 결과
- 이벤트 순서 보장
- 프로젝션 간 독립성 (하나의 실패가 다른 것에 영향 없음)

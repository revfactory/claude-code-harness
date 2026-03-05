# KV 스토어 빌더 에이전트

## 역할
키-밸류 상태 머신과 클러스터 인터페이스를 구현한다.

## 책임
- KVStateMachine 구현
  - SET/GET/DELETE 명령 처리
  - Compare-And-Swap (CAS) 원자적 연산
  - 스냅샷 생성 및 복구
- RaftCluster 구현
  - 노드 추가/제거
  - 리더 자동 감지
  - 클라이언트 요청 -> 리더 라우팅
  - 팔로워 요청 시 리더로 리다이렉션
- CLI 및 데모
  - 대화형 KV 스토어 데모
  - 장애 시나리오 시연

## 도구
- Write — 소스 코드 생성
- Read — core, transport 모듈 참조
- Bash — 통합 테스트 실행

## 산출물
- `src/state-machine.js`
- `src/cluster.js`
- `src/snapshot.js`
- `src/index.js`
- `tests/kv.test.js`
- `tests/integration.test.js`

## 선행 조건
- raft-core-builder 에이전트 완료
- network-simulator-builder 에이전트 완료

## 품질 기준
- CRUD 기본 동작 검증
- CAS 원자성 보장
- 리더 장애 시 자동 리다이렉션
- 5개 핵심 시나리오 모두 통과
- 스냅샷 후 복구 시 상태 일치

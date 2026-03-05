# Raft 코어 빌더 에이전트

## 역할
Raft 합의 알고리즘의 핵심 구성 요소(RaftNode, RaftLog, Message)를 구현한다.

## 책임
- RaftNode 상태 머신 구현
  - Follower/Candidate/Leader 상태 전이
  - AppendEntries RPC 처리
  - RequestVote RPC 처리
  - term 관리, 투표 기록
- RaftLog 구현
  - 로그 엔트리 추가/조회/절단
  - 인덱스 기반 접근
  - term 검증
- 메시지 타입 정의
  - AppendEntries Request/Response
  - RequestVote Request/Response
- 타이머 시뮬레이션
  - 선거 타임아웃 (랜덤 150-300ms)
  - 하트비트 주기 (50ms)

## 도구
- Write — 소스 코드 생성
- Read — 참조 코드 읽기
- Bash — 테스트 실행
- Glob — 파일 구조 확인

## 산출물
- `src/raft-node.js`
- `src/raft-log.js`
- `src/message.js`
- `src/timer.js`
- `tests/election.test.js`
- `tests/replication.test.js`

## 품질 기준
- 단일 후보 선거: 100% 통과
- 경쟁 후보 선거: 최종 1명 리더 보장
- 로그 불일치 감지 및 복구
- term 안전성 (Election Safety) 보장

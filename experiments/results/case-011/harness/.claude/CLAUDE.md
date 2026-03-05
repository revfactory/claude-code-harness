# 분산 키-밸류 스토어 (Raft Consensus)

## 아키텍처
```
Client Request -> [RaftCluster] -> [Leader RaftNode]
                                       |
                              [Log Replication]
                              |        |        |
                        [Follower1] [Follower2] [Follower3]
                              |        |        |
                        [KVStateMachine] (각 노드 로컬)
```

## 파일 구조
```
src/
  raft-node.js          - Raft 노드 (상태 머신: Follower/Candidate/Leader)
  raft-log.js           - 복제 로그 관리
  state-machine.js      - KV 상태 머신 (SET/GET/DELETE/CAS)
  transport.js          - 시뮬레이션 전송 레이어
  cluster.js            - 클러스터 관리 + 클라이언트 API
  timer.js              - 선거/하트비트 타이머 (시뮬레이션 가능)
  message.js            - RPC 메시지 정의 (AppendEntries, RequestVote)
  snapshot.js           - 로그 압축 + 스냅샷
  index.js              - CLI 진입점 + 데모
tests/
  election.test.js      - 리더 선출 테스트
  replication.test.js   - 로그 복제 테스트
  partition.test.js     - 네트워크 분할 테스트
  kv.test.js            - KV CRUD 테스트
  integration.test.js   - 전체 시나리오 통합 테스트
```

## Raft 핵심 규칙
- term이 높은 노드가 항상 우선
- 과반(majority) 동의 없이는 커밋 불가
- 로그 불일치 시 리더의 로그로 덮어쓰기
- 선거 타임아웃: 랜덤 (150-300ms 시뮬레이션)
- heartbeat 주기: 선거 타임아웃의 1/3

## 규칙
- 동기식 시뮬레이션 (tick 기반, 실제 타이머 사용하지 않음)
- 모든 RPC는 message 객체로 직렬화
- 네트워크 파티션은 Transport 레이어에서 처리
- 스냅샷은 로그 엔트리 100개 초과 시 자동 생성

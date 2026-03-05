---
name: raft-consensus-design
description: "Raft 합의 알고리즘 설계 및 구현 가이드. 분산 시스템, 합의 프로토콜, 리더 선출, 로그 복제를 구현할 때 사용한다."
---

# Raft Consensus Design Skill

## 핵심 개념

### 노드 상태 전이
```
                 starts up
                    |
              [Follower] <--------------------------+
                    |                                |
          election timeout              discovers higher term
                    |                                |
              [Candidate] -----------------> [Leader]
                    |         wins           |
                    |        election        |
                    +------------------------+
                      discovers higher term
```

### AppendEntries RPC
- 리더 -> 팔로워 heartbeat + 로그 복제
- prevLogIndex/prevLogTerm 일치 검증
- 불일치 시 nextIndex 감소 후 재전송
- leaderCommit으로 커밋 인덱스 동기화

### RequestVote RPC  
- 후보 -> 전체 노드 투표 요청
- 투표 조건: term이 같거나 높고, 로그가 최소한 같이 up-to-date
- 한 term에 하나의 투표만 허용

### 안전성 보장
- **Election Safety**: 한 term에 최대 1명의 리더
- **Leader Append-Only**: 리더는 로그를 덮어쓰지 않음
- **Log Matching**: 같은 index+term -> 같은 명령
- **Leader Completeness**: 커밋된 엔트리는 미래 리더에도 존재
- **State Machine Safety**: 같은 인덱스 -> 같은 명령 적용

## 구현 순서
1. RaftLog (순수 데이터 구조)
2. Message 정의 (AppendEntries, RequestVote)
3. RaftNode 상태 머신 (가장 핵심)
4. Timer (시뮬레이션용)
5. Transport (메시지 전달)
6. KVStateMachine
7. Cluster (통합)
8. 테스트 (선출 -> 복제 -> 파티션)

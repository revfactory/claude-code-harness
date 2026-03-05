# Raft RPC 상세 명세

## AppendEntries RPC

### Request
```javascript
{
  type: 'AppendEntries',
  term: number,           // 리더의 현재 term
  leaderId: string,       // 리더 ID
  prevLogIndex: number,   // 새 엔트리 직전 로그 인덱스
  prevLogTerm: number,    // prevLogIndex의 term
  entries: LogEntry[],    // 복제할 로그 엔트리 (heartbeat 시 비어있음)
  leaderCommit: number    // 리더의 commitIndex
}
```

### Response
```javascript
{
  type: 'AppendEntriesResponse',
  term: number,           // 응답자의 currentTerm
  success: boolean,       // prevLogIndex/prevLogTerm 일치 여부
  matchIndex: number      // 성공 시 마지막 일치 인덱스
}
```

### 처리 로직
1. `request.term < currentTerm` -> reject
2. `log[prevLogIndex].term !== prevLogTerm` -> reject (로그 불일치)
3. 기존 엔트리와 충돌 시 해당 위치부터 삭제
4. 새 엔트리 추가
5. `leaderCommit > commitIndex` -> commitIndex 업데이트
6. 선거 타이머 리셋

## RequestVote RPC

### Request
```javascript
{
  type: 'RequestVote',
  term: number,           // 후보의 term
  candidateId: string,    // 후보 ID
  lastLogIndex: number,   // 후보의 마지막 로그 인덱스
  lastLogTerm: number     // 후보의 마지막 로그 term
}
```

### Response
```javascript
{
  type: 'RequestVoteResponse',
  term: number,
  voteGranted: boolean
}
```

### 투표 조건
1. `request.term >= currentTerm`
2. `votedFor === null || votedFor === candidateId`
3. 후보의 로그가 up-to-date:
   - `lastLogTerm > myLastLogTerm` OR
   - `lastLogTerm === myLastLogTerm && lastLogIndex >= myLastLogIndex`

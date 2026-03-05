# 네트워크 분할 처리

## 분할 시나리오별 처리

### 리더가 소수(minority)에 포함
```
[A(리더), B] | [C, D, E]
```
- A는 과반 복제 실패 -> 새 쓰기 커밋 불가
- C/D/E 중 한 노드가 election timeout -> 새 리더 선출
- 복구 시 A의 미커밋 엔트리는 새 리더 로그로 덮어쓰기

### 리더가 다수(majority)에 포함
```
[A(리더), B, C] | [D, E]
```
- A는 정상 운영 (B,C와 과반)
- D,E는 선거 시도하지만 과반 불가 -> 계속 후보 상태 반복
- 복구 시 D,E가 리더의 로그를 따라잡음

### 3-way 분할
```
[A,B] | [C,D] | [E]
```
- 어떤 그룹도 과반 불가 -> 시스템 정지 (availability 포기)
- 복구 시 가장 up-to-date한 노드가 리더 선출

## Transport 구현 패턴
```javascript
class SimulatedTransport {
  constructor() {
    this.partitions = new Map(); // nodeId -> partitionGroup
    this.messageQueue = [];
  }
  
  send(from, to, message) {
    if (this.isPartitioned(from, to)) return; // 메시지 드롭
    if (Math.random() < this.dropRate) return; // 랜덤 드롭
    
    const delay = this.baseLatency + Math.random() * this.jitter;
    this.messageQueue.push({ 
      deliverAt: this.currentTime + delay, 
      from, to, message 
    });
  }
  
  tick(ms) {
    this.currentTime += ms;
    const ready = this.messageQueue
      .filter(m => m.deliverAt <= this.currentTime)
      .sort((a, b) => a.deliverAt - b.deliverAt);
    // 순서대로 전달
  }
}
```

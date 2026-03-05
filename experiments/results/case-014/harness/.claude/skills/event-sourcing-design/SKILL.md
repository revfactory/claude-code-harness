---
name: event-sourcing-design
description: "이벤트 소싱 + CQRS 패턴 설계 가이드. EventStore, Aggregate, Projection, Saga, Snapshot 구현 시 사용한다."
---

# Event Sourcing CQRS Design Skill

## 이벤트 소싱 핵심 원칙
1. **이벤트 = 사실(fact)**: 과거에 발생한 것, 불변
2. **상태 = fold(events)**: 이벤트를 순서대로 적용한 결과
3. **추가 전용(append-only)**: 이벤트 스트림에 추가만 가능
4. **시간 여행**: 과거 시점의 상태를 재구성 가능

## Aggregate 패턴
```javascript
class BankAccount extends AggregateRoot {
  constructor(id) {
    super(id);
    this.balance = 0;
    this.status = 'active';
  }

  // 커맨드 메서드: 비즈니스 규칙 검증 → 이벤트 생성
  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.status === 'frozen') throw new Error('Account is frozen');
    this.apply(new MoneyDeposited(this.id, amount, this.balance + amount));
  }

  // 이벤트 핸들러: 상태 변경만 (부수효과 없음)
  onMoneyDeposited(event) {
    this.balance = event.balance;
  }
}
```

## CQRS 분리
```
Write Side (Command)          Read Side (Query)
─────────────────            ─────────────────
CommandHandler               Projection
  → Aggregate.method()         → 이벤트 구독
  → EventStore.append()        → ReadModel 갱신
                               → Query API 제공
```

## Saga 상태 머신
```
TransferSaga:
  INITIATED → DEBITED → COMPLETED
                ↓ (실패)
            COMPENSATING → FAILED
```

## 구현 순서
1. EventStore (핵심 인프라)
2. AggregateRoot (기반 클래스)
3. EventBus (이벤트 전파)
4. CommandBus (커맨드 디스패치)
5. Repository (Aggregate 로딩/저장)
6. BankAccount Aggregate (도메인)
7. Projection (읽기 모델)
8. Saga (이체 프로세스)
9. SnapshotStore (최적화)
10. 통합 테스트

# Saga 패턴 구현

## TransferSaga 상태 머신
```
States: INITIATED, DEBITED, CREDITED, COMPLETED, COMPENSATING, FAILED

Transitions:
  INITIATED + TransferInitiated → dispatch Withdraw → DEBITED
  DEBITED + MoneyWithdrawn → dispatch Deposit → CREDITED
  CREDITED + MoneyDeposited → emit TransferCompleted → COMPLETED
  DEBITED + WithdrawFailed → compensate → FAILED
  CREDITED + DepositFailed → dispatch CompensateWithdraw → COMPENSATING
  COMPENSATING + MoneyDeposited(refund) → emit TransferFailed → FAILED
```

## 구현
```javascript
class TransferSaga extends Saga {
  constructor() {
    super();
    this.state = 'IDLE';
    this.transferId = null;
    this.fromAccount = null;
    this.toAccount = null;
    this.amount = 0;
  }

  handle(event) {
    switch (this.state) {
      case 'IDLE':
        if (event instanceof TransferInitiated) {
          this.transferId = event.transferId;
          this.fromAccount = event.fromAccountId;
          this.toAccount = event.toAccountId;
          this.amount = event.amount;
          this.state = 'INITIATED';
          return new Withdraw(this.fromAccount, this.amount);
        }
        break;

      case 'INITIATED':
        if (event instanceof MoneyWithdrawn && 
            event.accountId === this.fromAccount) {
          this.state = 'DEBITED';
          return new Deposit(this.toAccount, this.amount);
        }
        break;

      case 'DEBITED':
        if (event instanceof MoneyDeposited && 
            event.accountId === this.toAccount) {
          this.state = 'COMPLETED';
          return new CompleteTransfer(this.transferId);
        }
        if (event instanceof DepositFailed) {
          this.state = 'COMPENSATING';
          // 보상: 출금 취소 (환불)
          return new Deposit(this.fromAccount, this.amount);
        }
        break;

      case 'COMPENSATING':
        if (event instanceof MoneyDeposited && 
            event.accountId === this.fromAccount) {
          this.state = 'FAILED';
          return new FailTransfer(this.transferId, 'Deposit to target failed');
        }
        break;
    }
  }
}
```

## 보상 트랜잭션 원칙
1. 보상은 "실행 취소"가 아닌 "역방향 작업"
2. 보상 자체도 이벤트로 기록
3. 보상 실패 시 → 수동 개입 필요 (알림)
4. Saga 상태는 영속화하여 시스템 재시작 후에도 복구

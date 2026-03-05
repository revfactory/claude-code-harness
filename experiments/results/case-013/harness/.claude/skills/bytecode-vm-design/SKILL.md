---
name: bytecode-vm-design
description: "바이트코드 컴파일러 + 스택 VM 설계 가이드. MiniLang을 바이트코드로 컴파일하고 VM에서 실행할 때 사용한다."
---

# Bytecode VM Design Skill

## Opcode 인코딩
```
1바이트 opcode + 0~2바이트 오퍼랜드
예: OP_CONST 0x05 → [0x01, 0x05] (2바이트)
    OP_ADD         → [0x10]      (1바이트)
    OP_JUMP 0x00FF → [0x20, 0x00, 0xFF] (3바이트)
```

## 스택 기반 실행 모델
```
예: (10 + 3) * 2

OP_CONST 10    stack: [10]
OP_CONST 3     stack: [10, 3]
OP_ADD         stack: [13]
OP_CONST 2     stack: [13, 2]
OP_MUL         stack: [26]
```

## 클로저 & Upvalue 메커니즘
```
fn outer() {
  let x = 10;        // 로컬 변수 (스택)
  fn inner() {
    return x;         // upvalue로 캡처
  }
  return inner;       // outer 종료 후에도 x 접근 가능해야 함
}

// 컴파일 시:
// inner의 upvalue 목록: [{ index: 0, isLocal: true }]
// 
// 런타임:
// inner가 생성될 때 outer의 스택 슬롯 0을 가리키는 ObjUpvalue 생성
// outer가 반환될 때 ObjUpvalue를 "close" → 스택에서 힙으로 값 이동
```

## VM 메인 루프 패턴
```javascript
run() {
  while (true) {
    const op = this.readByte();
    switch (op) {
      case OP_CONST:
        this.push(this.readConstant());
        break;
      case OP_ADD: {
        const b = this.pop();
        const a = this.pop();
        this.push(a + b);
        break;
      }
      case OP_RETURN: {
        const result = this.pop();
        this.callFrames.pop();
        if (this.callFrames.length === 0) return result;
        this.push(result);
        break;
      }
      // ...
    }
  }
}
```

## 컴파일 패턴: if-else
```javascript
// if (cond) { then } else { alt }
compileIf(node) {
  this.compile(node.condition);
  const jumpToElse = this.emitJump(OP_JUMP_IF_FALSE);
  this.emit(OP_POP); // condition 제거
  this.compile(node.thenBranch);
  const jumpOverElse = this.emitJump(OP_JUMP);
  this.patchJump(jumpToElse);
  this.emit(OP_POP); // condition 제거
  if (node.elseBranch) this.compile(node.elseBranch);
  this.patchJump(jumpOverElse);
}
```

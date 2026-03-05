# 클로저 & Upvalue 구현 상세

## 개념
```
Upvalue: 외부 함수의 로컬 변수를 참조하는 포인터
- Open upvalue: 스택에 있는 변수를 가리킴
- Closed upvalue: 스택에서 복사된 값을 소유
```

## 자료 구조
```javascript
class ObjUpvalue {
  constructor(stackIndex) {
    this.location = stackIndex;  // open 상태: 스택 인덱스
    this.closed = null;          // closed 상태: 실제 값
    this.isOpen = true;
  }
  
  get value() {
    return this.isOpen ? vm.stack[this.location] : this.closed;
  }
  
  set value(val) {
    if (this.isOpen) vm.stack[this.location] = val;
    else this.closed = val;
  }
  
  close(value) {
    this.closed = value;
    this.isOpen = false;
  }
}
```

## 컴파일러 처리
```javascript
// fn inner() { return x; } → OP_CLOSURE
// upvalue 정보: [{ index: localSlot, isLocal: true }]
// isLocal=true: 바로 바깥 함수의 로컬 변수
// isLocal=false: 바깥 함수의 upvalue를 재참조

compileFunction(node) {
  const fn = new FunctionChunk(node.name, node.params.length);
  this.beginScope();
  // ... 함수 본문 컴파일 ...
  this.endScope();
  
  this.emit(OP_CLOSURE, this.addConstant(fn));
  for (const upval of fn.upvalues) {
    this.emit(upval.isLocal ? 1 : 0, upval.index);
  }
}
```

## VM 처리
```javascript
// OP_CLOSURE 실행
case OP_CLOSURE: {
  const fn = this.readConstant();
  const closure = new ObjClosure(fn);
  for (let i = 0; i < fn.upvalueCount; i++) {
    const isLocal = this.readByte();
    const index = this.readByte();
    if (isLocal) {
      closure.upvalues[i] = this.captureUpvalue(frame.slotOffset + index);
    } else {
      closure.upvalues[i] = frame.closure.upvalues[index];
    }
  }
  this.push(closure);
  break;
}

// 함수 반환 시 open upvalue를 close
case OP_RETURN: {
  const result = this.pop();
  this.closeUpvalues(frame.slotOffset);
  // ...
}
```

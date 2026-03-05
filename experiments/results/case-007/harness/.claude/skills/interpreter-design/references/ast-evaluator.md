# AST & Evaluator 참조

## AST 노드 타입 (최소 필수)

```javascript
// 문
Program, LetStatement, ReturnStatement, ExpressionStatement, BlockStatement
// 식
Identifier, NumberLiteral, StringLiteral, BoolLiteral, NullLiteral, ArrayLiteral
BinaryExpr, UnaryExpr, AssignExpr
IfExpr, WhileStatement, ForStatement
FunctionLiteral, CallExpr, IndexExpr
// 익명 함수
FunctionLiteral { params: [], body: BlockStatement }
```

## Environment 클래스

```javascript
class Environment {
  constructor(parent = null) {
    this.store = new Map();
    this.parent = parent;
  }
  get(name) {
    if (this.store.has(name)) return this.store.get(name);
    if (this.parent) return this.parent.get(name);
    throw new RuntimeError(`Undefined variable: ${name}`);
  }
  set(name, value) { /* 기존 변수 업데이트: 스코프 체인 탐색 */ }
  define(name, value) { /* 새 변수 선언: 현재 스코프에 추가 */ }
}
```

## 클로저 패턴

```javascript
// 함수 정의 시 현재 환경을 캡처
class MiniFunction {
  constructor(params, body, closure) {
    this.params = params;
    this.body = body;
    this.closure = closure;  // 정의 시점의 Environment
  }
}
```

## Interpreter evaluate 핵심 코드

```javascript
evaluate(node, env) {
  switch (node.type) {
    case 'NumberLiteral': return node.value;
    case 'BinaryExpr': return this.evalBinary(node, env);
    case 'IfExpr': return this.evalIf(node, env);
    case 'FunctionLiteral':
      return new MiniFunction(node.params, node.body, env); // 클로저!
    case 'CallExpr':
      const fn = this.evaluate(node.function, env);
      const args = node.arguments.map(a => this.evaluate(a, env));
      const fnEnv = new Environment(fn.closure); // 클로저 환경 사용
      fn.params.forEach((p, i) => fnEnv.define(p, args[i]));
      return this.evaluate(fn.body, fnEnv);
    // ...
  }
}
```

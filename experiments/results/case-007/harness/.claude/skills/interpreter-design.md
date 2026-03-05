# Interpreter Design Skill

프로그래밍 언어 인터프리터 설계 및 구현 가이드

## Trigger Conditions
- 인터프리터, 파서, 언어 구현 요청 시

## Instructions

### Lexer 설계 패턴
```javascript
// 토큰 타입 열거
const TokenType = {
  // 리터럴
  NUMBER: 'NUMBER', STRING: 'STRING', IDENTIFIER: 'IDENTIFIER',
  TRUE: 'TRUE', FALSE: 'FALSE', NULL: 'NULL',
  // 연산자
  PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH', PERCENT: 'PERCENT',
  EQ: 'EQ', NEQ: 'NEQ', LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE',
  AND: 'AND', OR: 'OR', NOT: 'NOT',
  ASSIGN: 'ASSIGN',
  // 구분자
  LPAREN: 'LPAREN', RPAREN: 'RPAREN',
  LBRACE: 'LBRACE', RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET', RBRACKET: 'RBRACKET',
  COMMA: 'COMMA', SEMICOLON: 'SEMICOLON',
  // 키워드
  LET: 'LET', FN: 'FN', RETURN: 'RETURN',
  IF: 'IF', ELSE: 'ELSE', WHILE: 'WHILE', FOR: 'FOR',
  // 특수
  EOF: 'EOF'
};

// 토큰 구조: { type, value, line, column }
```

### Parser 설계 - Pratt Parser (연산자 우선순위)
```javascript
// 우선순위 테이블
const PRECEDENCE = {
  LOWEST: 1,
  OR: 2,        // ||
  AND: 3,       // &&
  EQUALITY: 4,  // ==, !=
  COMPARE: 5,   // <, >, <=, >=
  SUM: 6,       // +, -
  PRODUCT: 7,   // *, /, %
  PREFIX: 8,    // !, -
  CALL: 9,      // fn()
  INDEX: 10,    // arr[0]
};

// Pratt 파서 핵심 루프
parseExpression(precedence) {
  let left = this.parsePrefix();  // prefix 파서 (리터럴, 식별자, 그룹, 단항연산)
  while (precedence < this.currentPrecedence()) {
    left = this.parseInfix(left);  // infix 파서 (이항연산, 호출, 인덱스)
  }
  return left;
}
```

### AST 노드 타입 (최소 필수)
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

### Environment (스코프 + 클로저)
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

// 클로저: 함수 정의 시 현재 환경을 캡처
class MiniFunction {
  constructor(params, body, closure) {
    this.params = params;
    this.body = body;
    this.closure = closure;  // 정의 시점의 Environment
  }
}
```

### Interpreter 핵심 패턴
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

### 테스트 전략
- **Lexer**: 각 토큰 타입별 tokenize 테스트
- **Parser**: 표현식 우선순위, 제어문, 함수 선언 파싱 테스트
- **Interpreter**: 산술, 비교, 변수, 제어흐름, 함수, 클로저 각각
- **Integration**: 피보나치, map/filter, makeCounter 검증 프로그램

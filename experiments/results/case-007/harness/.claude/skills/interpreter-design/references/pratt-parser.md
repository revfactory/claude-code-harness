# Pratt Parser 참조

## 토큰 타입 정의

```javascript
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

## 우선순위 테이블

```javascript
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
```

## Pratt Parser 핵심 루프

```javascript
parseExpression(precedence) {
  let left = this.parsePrefix();  // prefix 파서 (리터럴, 식별자, 그룹, 단항연산)
  while (precedence < this.currentPrecedence()) {
    left = this.parseInfix(left);  // infix 파서 (이항연산, 호출, 인덱스)
  }
  return left;
}
```

- `parsePrefix()`: 리터럴, 식별자, 그룹(`(`), 단항연산(`!`, `-`)
- `parseInfix(left)`: 이항연산, 함수 호출(`(`), 인덱스 접근(`[`)
- `currentPrecedence()`: 현재 토큰의 우선순위 반환

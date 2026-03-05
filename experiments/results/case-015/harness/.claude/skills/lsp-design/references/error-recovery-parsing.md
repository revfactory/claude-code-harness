# 에러 복구 파싱

## 목표
문법 에러가 있어도 최대한 많은 AST 노드를 생성하여
후속 분석(진단, 자동완성)이 가능하도록 한다.

## 전략

### 1. Panic Mode Recovery
```javascript
// 에러 발생 시 동기화 토큰까지 스킵
synchronize() {
  this.advance(); // 문제 토큰 건너뛰기

  while (!this.isAtEnd()) {
    // 세미콜론 이후는 새 문장
    if (this.previous().type === 'SEMICOLON') return;

    // 문장 시작 키워드
    switch (this.peek().type) {
      case 'LET':
      case 'FN':
      case 'IF':
      case 'WHILE':
      case 'FOR':
      case 'RETURN':
      case 'PRINT':
        return;
    }

    this.advance();
  }
}
```

### 2. Error Productions
```javascript
// 기대하는 토큰이 없을 때 에러 노드 생성
expect(type, message) {
  if (this.check(type)) return this.advance();

  const error = {
    type: 'Error',
    message,
    position: this.peek().position,
    expected: type,
    got: this.peek().type
  };

  this.errors.push(error);
  return { type: 'ErrorNode', error };
}
```

### 3. 부분 AST 생성
```javascript
parseStatement() {
  try {
    if (this.match('LET')) return this.letDeclaration();
    if (this.match('FN')) return this.fnDeclaration();
    // ...
    return this.expressionStatement();
  } catch (e) {
    this.errors.push({
      message: e.message,
      position: this.current.position
    });
    this.synchronize();
    return { type: 'ErrorStatement', error: e.message };
  }
}
```

## 에러 노드가 있는 AST 예시
```javascript
// 입력: "let x = ; fn add(a) { return a; }"
{
  type: 'Program',
  body: [
    {
      type: 'LetDeclaration',
      name: 'x',
      init: { type: 'ErrorNode', error: 'Expected expression' }
    },
    {
      type: 'FunctionDeclaration',
      name: 'add',
      params: ['a'],
      body: { type: 'Block', statements: [
        { type: 'ReturnStatement', value: { type: 'Identifier', name: 'a' } }
      ]}
    }
  ]
}
```

## 진단 생성 시 주의
- 에러 복구로 생성된 ErrorNode에서만 진단 생성
- 연쇄 에러 방지: 한 영역에서 최대 1개 에러만 보고
- 닫히지 않은 괄호/중괄호는 별도 추적

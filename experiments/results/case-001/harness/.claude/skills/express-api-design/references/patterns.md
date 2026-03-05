# Express API Design - Code Patterns

## 유효성 검사 패턴

미들웨어로 분리하여 재사용:

- ID 파라미터: 정수 여부, 양수 여부 검증
- Body 필드: 필수 필드 존재, 빈 문자열 차단, 타입 검증

```javascript
// middleware/validate.js
function validateId(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  req.params.id = id;
  next();
}

function validateBody(requiredFields) {
  return (req, res, next) => {
    for (const field of requiredFields) {
      if (!req.body[field] || typeof req.body[field] !== 'string' || req.body[field].trim() === '') {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    next();
  };
}
```

## 에러 핸들링 패턴

컨트롤러에서 throw -> 글로벌 에러 핸들러에서 catch:

```javascript
// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}
```

## 데이터 모델 패턴

클래스 기반 싱글턴 스토어, 불변성 보장:

```javascript
// models/todoStore.js
class TodoStore {
  constructor() {
    this.todos = [];
    this.nextId = 1;
  }

  findAll() {
    return this.todos.map(t => ({ ...t }));
  }

  findById(id) {
    const todo = this.todos.find(t => t.id === id);
    return todo ? { ...todo } : null;
  }

  create(data) {
    const todo = {
      id: this.nextId++,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.todos.push(todo);
    return { ...todo };
  }

  update(id, data) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.todos[index] = { ...this.todos[index], ...data };
    return { ...this.todos[index] };
  }

  delete(id) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return null;
    return this.todos.splice(index, 1)[0];
  }
}

module.exports = new TodoStore();
```

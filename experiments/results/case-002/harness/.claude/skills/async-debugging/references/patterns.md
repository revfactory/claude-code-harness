# Async Debugging - Code Patterns

## _fetch() 헬퍼 패턴

공통 fetch 로직을 헬퍼로 추출하여 중복 제거:

```javascript
async _fetch(key, fetchFn) {
  if (this.pending.has(key)) {
    return this.pending.get(key);
  }

  const promise = fetchFn().then(value => {
    this.cache.set(key, value);
    return value;
  });

  this.pending.set(key, promise);

  try {
    return await promise;
  } finally {
    this.pending.delete(key);
  }
}
```

## try/finally 리소스 정리 패턴

에러 발생 시에도 pending 상태가 반드시 정리되도록 보장:

```javascript
async get(key, fetchFn) {
  if (this.cache.has(key)) {
    return this.cache.get(key);
  }
  return this._fetch(key, fetchFn);
}

async refresh(key, fetchFn) {
  this.cache.delete(key);
  return this._fetch(key, fetchFn);
}
```

## Jest 동시성 테스트 패턴

```javascript
// 동시 요청 테스트 - fetchFn이 1회만 호출되어야 함
test('concurrent gets deduplicate fetch calls', async () => {
  const fetchFn = jest.fn().mockResolvedValue('value');
  const [r1, r2] = await Promise.all([
    cache.get('k', fetchFn),
    cache.get('k', fetchFn)
  ]);
  expect(r1).toBe('value');
  expect(r2).toBe('value');
  expect(fetchFn).toHaveBeenCalledTimes(1);
});

// refresh 중 get 테스트 - get은 refresh 완료 후의 새 값을 반환해야 함
test('get during refresh waits for new value', async () => {
  const slowFn = () => new Promise(r => setTimeout(() => r('new'), 100));
  const refreshPromise = cache.refresh('k', slowFn);
  const getPromise = cache.get('k', jest.fn());
  const [refreshResult, getResult] = await Promise.all([refreshPromise, getPromise]);
  expect(getResult).toBe('new');
});

// 에러 후 정리 테스트 - pending이 정리되어 다음 요청이 정상 동작해야 함
test('cleans up pending after error', async () => {
  const errorFn = jest.fn().mockRejectedValue(new Error('fail'));
  await cache.get('k', errorFn).catch(() => {});

  const successFn = jest.fn().mockResolvedValue('ok');
  const result = await cache.get('k', successFn);
  expect(result).toBe('ok');
});
```

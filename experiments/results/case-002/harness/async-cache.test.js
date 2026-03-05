const { AsyncCache } = require('./async-cache');

describe('AsyncCache', () => {
  let cache;

  beforeEach(() => {
    cache = new AsyncCache();
  });

  // --- 기본 동작 ---

  test('get: 캐시 미스 시 fetchFn 호출하여 값 반환', async () => {
    const fetchFn = jest.fn(async (key) => `value-${key}`);
    const result = await cache.get('a', fetchFn);
    expect(result).toBe('value-a');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('get: 캐시 히트 시 fetchFn 호출하지 않음', async () => {
    const fetchFn = jest.fn(async (key) => `value-${key}`);
    await cache.get('a', fetchFn);
    const result = await cache.get('a', fetchFn);
    expect(result).toBe('value-a');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('invalidate: 캐시 삭제 후 재요청 시 fetchFn 재호출', async () => {
    let callCount = 0;
    const fetchFn = jest.fn(async (key) => `value-${++callCount}`);
    await cache.get('a', fetchFn);
    cache.invalidate('a');
    const result = await cache.get('a', fetchFn);
    expect(result).toBe('value-2');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test('refresh: 캐시를 갱신하고 새 값 반환', async () => {
    let callCount = 0;
    const fetchFn = jest.fn(async () => `value-${++callCount}`);
    await cache.get('a', fetchFn);
    const result = await cache.refresh('a', fetchFn);
    expect(result).toBe('value-2');
  });

  // --- 동시성 시나리오 ---

  test('동시 get: 동일 키에 대해 fetchFn 한 번만 호출', async () => {
    let callCount = 0;
    const fetchFn = jest.fn(async (key) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return `value-${callCount}`;
    });

    const [r1, r2, r3] = await Promise.all([
      cache.get('k', fetchFn),
      cache.get('k', fetchFn),
      cache.get('k', fetchFn),
    ]);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(r1).toBe('value-1');
    expect(r2).toBe('value-1');
    expect(r3).toBe('value-1');
  });

  test('refresh 중 get: get이 refresh의 새 값을 대기하여 반환', async () => {
    const fetchFn = jest.fn(async () => 'old');
    await cache.get('k', fetchFn);

    const slowFn = jest.fn(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'new';
    });

    const refreshPromise = cache.refresh('k', slowFn);
    // refresh가 캐시를 삭제한 직후, get이 호출됨
    const getPromise = cache.get('k', jest.fn(async () => 'should-not-be-called'));

    const [refreshResult, getResult] = await Promise.all([refreshPromise, getPromise]);

    expect(refreshResult).toBe('new');
    expect(getResult).toBe('new');
    // slowFn만 호출되어야 함 (get의 fetchFn은 호출되지 않아야 함)
    expect(slowFn).toHaveBeenCalledTimes(1);
  });

  test('에러 시 pending 정리: 에러 후 다음 요청이 정상 동작', async () => {
    const errorFn = jest.fn(async () => {
      throw new Error('fetch failed');
    });

    await expect(cache.get('k', errorFn)).rejects.toThrow('fetch failed');

    // pending이 정리되었으므로 새 fetchFn으로 정상 동작해야 함
    const successFn = jest.fn(async () => 'success');
    const result = await cache.get('k', successFn);
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  test('에러 시 동시 요청도 모두 에러를 받음', async () => {
    const errorFn = jest.fn(async () => {
      await new Promise((r) => setTimeout(r, 30));
      throw new Error('boom');
    });

    const results = await Promise.allSettled([
      cache.get('k', errorFn),
      cache.get('k', errorFn),
    ]);

    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
    expect(errorFn).toHaveBeenCalledTimes(1);
  });

  test('서로 다른 키는 독립적으로 동작', async () => {
    const fetchFn = jest.fn(async (key) => {
      await new Promise((r) => setTimeout(r, 20));
      return `value-${key}`;
    });

    const [r1, r2] = await Promise.all([
      cache.get('a', fetchFn),
      cache.get('b', fetchFn),
    ]);

    expect(r1).toBe('value-a');
    expect(r2).toBe('value-b');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test('refresh 에러 시 pending 정리 및 캐시 미갱신', async () => {
    const fetchFn = jest.fn(async () => 'original');
    await cache.get('k', fetchFn);

    const errorFn = jest.fn(async () => {
      throw new Error('refresh failed');
    });

    await expect(cache.refresh('k', errorFn)).rejects.toThrow('refresh failed');

    // 캐시가 삭제된 상태이므로 새 fetch 필요
    const newFn = jest.fn(async () => 'recovered');
    const result = await cache.get('k', newFn);
    expect(result).toBe('recovered');
  });
});

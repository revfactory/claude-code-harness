const { AsyncCache } = require('./async-cache');

// Helper: create a deferred promise for fine-grained control
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

// Helper: delay utility
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.log(`  FAIL: ${name}`);
      console.log(`        ${err.message}`);
      failed++;
    }
  }

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${expected}, got ${actual}`);
    }
  }

  console.log('AsyncCache Tests\n');

  // ---- Test 1: Basic get and caching ----
  await test('basic get caches the value', async () => {
    const cache = new AsyncCache();
    let callCount = 0;
    const fetchFn = async (key) => { callCount++; return `value-${key}`; };

    const v1 = await cache.get('a', fetchFn);
    const v2 = await cache.get('a', fetchFn);

    assertEqual(v1, 'value-a');
    assertEqual(v2, 'value-a');
    assertEqual(callCount, 1, 'fetchFn should be called only once for cached key');
  });

  // ---- Test 2: Concurrent get deduplicates fetchFn calls ----
  await test('concurrent get() calls for same key run fetchFn only once', async () => {
    const cache = new AsyncCache();
    let callCount = 0;
    const d = deferred();

    const fetchFn = async (key) => {
      callCount++;
      return d.promise;
    };

    // Fire 3 concurrent gets
    const p1 = cache.get('x', fetchFn);
    const p2 = cache.get('x', fetchFn);
    const p3 = cache.get('x', fetchFn);

    d.resolve('result-x');

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    assertEqual(r1, 'result-x');
    assertEqual(r2, 'result-x');
    assertEqual(r3, 'result-x');
    assertEqual(callCount, 1, 'fetchFn must be called exactly once for concurrent requests');
  });

  // ---- Test 3: refresh() causes concurrent get() to wait for new value ----
  await test('get() during refresh() waits for the refreshed value', async () => {
    const cache = new AsyncCache();
    let version = 0;

    // Populate initial cache
    await cache.get('k', async () => { version++; return `v${version}`; });
    assertEqual(await cache.get('k', async () => 'stale'), 'v1');

    // Start a slow refresh
    const d = deferred();
    const refreshPromise = cache.refresh('k', async () => d.promise);

    // get() should now wait for refresh, not return stale or trigger a new fetch
    const getPromise = cache.get('k', async () => 'should-not-be-called');

    d.resolve('v2-refreshed');

    const [refreshResult, getResult] = await Promise.all([refreshPromise, getPromise]);
    assertEqual(refreshResult, 'v2-refreshed');
    assertEqual(getResult, 'v2-refreshed');
  });

  // ---- Test 4: Error cleans up pending ----
  await test('error in fetchFn cleans up pending and allows retry', async () => {
    const cache = new AsyncCache();
    let attempt = 0;

    const fetchFn = async () => {
      attempt++;
      if (attempt === 1) throw new Error('network error');
      return 'success';
    };

    // First call should fail
    let threw = false;
    try {
      await cache.get('err', fetchFn);
    } catch (e) {
      threw = true;
      assertEqual(e.message, 'network error');
    }
    assert(threw, 'First call should throw');

    // Second call should retry (pending was cleaned up)
    const result = await cache.get('err', fetchFn);
    assertEqual(result, 'success');
    assertEqual(attempt, 2, 'fetchFn should have been called twice total');
  });

  // ---- Test 5: Error during concurrent get() propagates to all waiters ----
  await test('error propagates to all concurrent waiters', async () => {
    const cache = new AsyncCache();
    const d = deferred();

    const fetchFn = async () => d.promise;

    const p1 = cache.get('fail', fetchFn);
    const p2 = cache.get('fail', fetchFn);

    d.reject(new Error('boom'));

    let errors = 0;
    for (const p of [p1, p2]) {
      try { await p; } catch (e) {
        assertEqual(e.message, 'boom');
        errors++;
      }
    }
    assertEqual(errors, 2, 'Both waiters should receive the error');
  });

  // ---- Test 6: refresh error cleans up pending ----
  await test('refresh() error cleans up pending', async () => {
    const cache = new AsyncCache();

    // Populate
    await cache.get('r', async () => 'old');

    // Refresh with error
    let threw = false;
    try {
      await cache.refresh('r', async () => { throw new Error('refresh fail'); });
    } catch (e) {
      threw = true;
    }
    assert(threw, 'refresh should throw');

    // Should be able to fetch again
    const v = await cache.get('r', async () => 'new-value');
    assertEqual(v, 'new-value');
  });

  // ---- Test 7: invalidate removes cached value ----
  await test('invalidate() removes cached value', async () => {
    const cache = new AsyncCache();
    let callCount = 0;

    await cache.get('inv', async () => { callCount++; return 'first'; });
    cache.invalidate('inv');
    const v = await cache.get('inv', async () => { callCount++; return 'second'; });

    assertEqual(v, 'second');
    assertEqual(callCount, 2);
  });

  // ---- Test 8: Different keys are independent ----
  await test('different keys are fetched independently', async () => {
    const cache = new AsyncCache();
    const [v1, v2] = await Promise.all([
      cache.get('a', async (k) => `val-${k}`),
      cache.get('b', async (k) => `val-${k}`),
    ]);
    assertEqual(v1, 'val-a');
    assertEqual(v2, 'val-b');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();

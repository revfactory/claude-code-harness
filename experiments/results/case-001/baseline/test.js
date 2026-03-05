const http = require('http');
const { app, resetStore } = require('./app');

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    passed++;
  } else {
    console.log(`  FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== TODO API Tests ===\n');

  // GET /todos - empty list
  let res = await request('GET', '/todos');
  assert(res.status === 200, 'GET /todos returns 200');
  assert(Array.isArray(res.body) && res.body.length === 0, 'GET /todos returns empty array');

  // POST /todos - create
  res = await request('POST', '/todos', { title: 'Test todo' });
  assert(res.status === 201, 'POST /todos returns 201');
  assert(res.body.id === 1, 'Created todo has id 1');
  assert(res.body.title === 'Test todo', 'Created todo has correct title');
  assert(res.body.completed === false, 'Created todo is not completed');
  assert(res.body.createdAt !== undefined, 'Created todo has createdAt');

  // POST /todos - validation: missing title
  res = await request('POST', '/todos', {});
  assert(res.status === 400, 'POST /todos without title returns 400');

  // POST /todos - validation: empty title
  res = await request('POST', '/todos', { title: '   ' });
  assert(res.status === 400, 'POST /todos with empty title returns 400');

  // GET /todos/:id
  res = await request('GET', '/todos/1');
  assert(res.status === 200, 'GET /todos/1 returns 200');
  assert(res.body.title === 'Test todo', 'GET /todos/1 returns correct todo');

  // GET /todos/:id - not found
  res = await request('GET', '/todos/999');
  assert(res.status === 404, 'GET /todos/999 returns 404');

  // PUT /todos/:id - update
  res = await request('PUT', '/todos/1', { title: 'Updated', completed: true });
  assert(res.status === 200, 'PUT /todos/1 returns 200');
  assert(res.body.title === 'Updated', 'PUT updates title');
  assert(res.body.completed === true, 'PUT updates completed');

  // PUT /todos/:id - validation
  res = await request('PUT', '/todos/1', { title: '' });
  assert(res.status === 400, 'PUT with empty title returns 400');

  // PUT /todos/:id - not found
  res = await request('PUT', '/todos/999', { title: 'Nope' });
  assert(res.status === 404, 'PUT /todos/999 returns 404');

  // DELETE /todos/:id
  res = await request('DELETE', '/todos/1');
  assert(res.status === 200, 'DELETE /todos/1 returns 200');

  // DELETE /todos/:id - not found
  res = await request('DELETE', '/todos/1');
  assert(res.status === 404, 'DELETE /todos/1 again returns 404');

  // Verify empty after delete
  res = await request('GET', '/todos');
  assert(res.body.length === 0, 'Todos list is empty after delete');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
}

// Start server, run tests, then shut down
server = app.listen(0, async () => {
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await runTests();
  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
});

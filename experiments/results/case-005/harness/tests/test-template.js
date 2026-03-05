'use strict';

const { render } = require('../src/template');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== 템플릿 엔진 테스트 ===');

// 변수 치환
assert(render('Hello {{ name }}!', { name: 'World' }) === 'Hello World!', '변수 치환');

// 존재하지 않는 변수
assert(render('{{ missing }}', {}) === '', '없는 변수');

// each 반복
{
  const tpl = '{{#each items}}[{{ this }}]{{/each}}';
  const result = render(tpl, { items: ['a', 'b', 'c'] });
  assert(result === '[a][b][c]', 'each 반복 (단순 배열)');
}

// each 반복 (객체 배열)
{
  const tpl = '{{#each people}}{{ name }},{{/each}}';
  const result = render(tpl, { people: [{ name: 'Alice' }, { name: 'Bob' }] });
  assert(result === 'Alice,Bob,', 'each 반복 (객체 배열)');
}

// if 조건 (truthy)
{
  const tpl = '{{#if show}}YES{{/if}}';
  assert(render(tpl, { show: true }) === 'YES', 'if truthy');
  assert(render(tpl, { show: false }) === '', 'if falsy');
}

// if-else
{
  const tpl = '{{#if active}}ON{{else}}OFF{{/if}}';
  assert(render(tpl, { active: true }) === 'ON', 'if-else truthy');
  assert(render(tpl, { active: false }) === 'OFF', 'if-else falsy');
}

// if with 배열 (빈 배열은 falsy)
{
  const tpl = '{{#if items}}HAS{{else}}EMPTY{{/if}}';
  assert(render(tpl, { items: [1] }) === 'HAS', 'if 배열 non-empty');
  assert(render(tpl, { items: [] }) === 'EMPTY', 'if 배열 empty');
}

console.log(`결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);

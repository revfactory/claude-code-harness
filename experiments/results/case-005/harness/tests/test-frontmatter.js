'use strict';

const { parseFrontmatter } = require('../src/frontmatter');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== Frontmatter 테스트 ===');

// 기본 파싱
{
  const input = `---
title: Hello
date: 2026-01-01
---

Body here`;
  const result = parseFrontmatter(input);
  assert(result.attributes.title === 'Hello', 'title 파싱');
  assert(result.attributes.date === '2026-01-01', 'date 파싱');
  assert(result.body.trim() === 'Body here', 'body 추출');
}

// 배열 파싱
{
  const input = `---
tags: [a, b, c]
---

content`;
  const result = parseFrontmatter(input);
  assert(Array.isArray(result.attributes.tags), '배열 타입');
  assert(result.attributes.tags.length === 3, '배열 길이');
  assert(result.attributes.tags[0] === 'a', '배열 첫 요소');
}

// boolean 파싱
{
  const input = `---
draft: true
published: false
---

x`;
  const result = parseFrontmatter(input);
  assert(result.attributes.draft === true, 'true 파싱');
  assert(result.attributes.published === false, 'false 파싱');
}

// frontmatter 없는 경우
{
  const result = parseFrontmatter('Just plain text');
  assert(result.body === 'Just plain text', 'frontmatter 없음 - body');
  assert(Object.keys(result.attributes).length === 0, 'frontmatter 없음 - attributes 비어있음');
}

console.log(`결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);

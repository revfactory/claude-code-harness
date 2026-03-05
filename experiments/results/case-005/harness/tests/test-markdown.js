'use strict';

const { convertMarkdown } = require('../src/markdown');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== Markdown 변환 테스트 ===');

// 헤딩
assert(convertMarkdown('# Hello').includes('<h1>Hello</h1>'), 'h1');
assert(convertMarkdown('## Sub').includes('<h2>Sub</h2>'), 'h2');
assert(convertMarkdown('###### Small').includes('<h6>Small</h6>'), 'h6');

// 볼드/이탤릭
assert(convertMarkdown('**bold**').includes('<strong>bold</strong>'), 'bold');
assert(convertMarkdown('*italic*').includes('<em>italic</em>'), 'italic');

// 링크
assert(convertMarkdown('[link](http://x.com)').includes('<a href="http://x.com">link</a>'), 'link');

// 이미지
assert(convertMarkdown('![alt](img.png)').includes('<img src="img.png" alt="alt">'), 'image');

// 인라인 코드
assert(convertMarkdown('`code`').includes('<code>code</code>'), 'inline code');

// 코드 블록
{
  const md = '```javascript\nconst x = 1;\n```';
  const html = convertMarkdown(md);
  assert(html.includes('<pre><code'), 'code block pre');
  assert(html.includes('data-lang="javascript"'), 'code block lang');
}

// 순서 없는 리스트
{
  const md = '- item1\n- item2';
  const html = convertMarkdown(md);
  assert(html.includes('<ul>'), 'ul 태그');
  assert(html.includes('<li>item1</li>'), 'li 요소');
}

// 순서 있는 리스트
{
  const md = '1. first\n2. second';
  const html = convertMarkdown(md);
  assert(html.includes('<ol>'), 'ol 태그');
  assert(html.includes('<li>first</li>'), 'ol li 요소');
}

// 인용
{
  const html = convertMarkdown('> quote text');
  assert(html.includes('<blockquote>'), 'blockquote');
}

// 수평선
assert(convertMarkdown('---').includes('<hr>'), 'hr');

// 단락
{
  const html = convertMarkdown('paragraph one\n\nparagraph two');
  assert(html.includes('<p>paragraph one</p>'), 'paragraph 1');
  assert(html.includes('<p>paragraph two</p>'), 'paragraph 2');
}

console.log(`결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);

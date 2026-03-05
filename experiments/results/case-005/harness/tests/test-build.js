'use strict';

const fs = require('fs');
const path = require('path');
const { build } = require('../src/builder');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== 빌드 통합 테스트 ===');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// 빌드 실행
const result = build(projectRoot);

// 빌드 결과 확인
assert(result && result.posts === 3, '3개 포스트 빌드');
assert(result && result.tags > 0, '태그 존재');

// dist 디렉토리 확인
assert(fs.existsSync(path.join(distDir, 'index.html')), 'index.html 생성');
assert(fs.existsSync(path.join(distDir, 'style.css')), 'style.css 생성');
assert(fs.existsSync(path.join(distDir, 'tags.html')), 'tags.html 생성');

// 포스트 파일 확인
assert(fs.existsSync(path.join(distDir, 'posts', 'hello-world.html')), 'hello-world.html 생성');
assert(fs.existsSync(path.join(distDir, 'posts', 'javascript-tips.html')), 'javascript-tips.html 생성');
assert(fs.existsSync(path.join(distDir, 'posts', 'python-basics.html')), 'python-basics.html 생성');

// 태그 파일 확인
assert(fs.existsSync(path.join(distDir, 'tags', 'blog.html')), 'blog 태그 페이지');
assert(fs.existsSync(path.join(distDir, 'tags', 'programming.html')), 'programming 태그 페이지');

// HTML 내용 확인
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
assert(indexHtml.includes('Python 기초 문법'), '인덱스에 포스트 제목');
assert(indexHtml.includes('<!DOCTYPE html>'), 'layout 적용');

const postHtml = fs.readFileSync(path.join(distDir, 'posts', 'hello-world.html'), 'utf-8');
assert(postHtml.includes('<h1>Hello World</h1>'), '포스트 제목');
assert(postHtml.includes('<strong>마크다운</strong>'), '볼드 변환');
assert(postHtml.includes('<blockquote>'), '인용문 변환');

// 날짜순 정렬 확인 (최신이 먼저)
const pythonIdx = indexHtml.indexOf('Python 기초 문법');
const jsIdx = indexHtml.indexOf('JavaScript 유용한 팁');
const helloIdx = indexHtml.indexOf('Hello World');
assert(pythonIdx < jsIdx && jsIdx < helloIdx, '날짜순 정렬 (최신 먼저)');

console.log(`결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);

#!/usr/bin/env node

'use strict';

/**
 * CLI 엔트리포인트
 * 사용법:
 *   blog build          - 정적 사이트 빌드
 *   blog new <title>    - 새 포스트 생성
 *   blog serve [port]   - 개발 서버 시작
 */

const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'build': {
    const { build } = require('../src/builder');
    build(projectRoot);
    break;
  }

  case 'new': {
    const title = args.slice(1).join(' ');
    if (!title) {
      console.error('사용법: blog new <title>');
      process.exit(1);
    }
    const { createPost } = require('../src/new-post');
    createPost(projectRoot, title);
    break;
  }

  case 'serve': {
    const port = parseInt(args[1], 10) || 3000;
    const { serve } = require('../src/server');
    serve(projectRoot, port);
    break;
  }

  default:
    console.log(`마크다운 블로그 생성기

사용법:
  blog build          정적 사이트 빌드
  blog new <title>    새 포스트 생성
  blog serve [port]   개발 서버 시작 (기본: 3000)
`);
    if (command) {
      console.error(`알 수 없는 명령: ${command}`);
      process.exit(1);
    }
}

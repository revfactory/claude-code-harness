'use strict';

/**
 * 새 포스트 생성
 */

const fs = require('fs');
const path = require('path');

function createPost(projectRoot, title) {
  const postsDir = path.join(projectRoot, 'posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const date = new Date().toISOString().split('T')[0];
  const filename = `${slug}.md`;
  const filepath = path.join(postsDir, filename);

  if (fs.existsSync(filepath)) {
    console.error(`이미 존재하는 파일: ${filename}`);
    return null;
  }

  const content = `---
title: ${title}
date: ${date}
tags: [blog]
description: ${title}에 대한 포스트입니다.
---

# ${title}

여기에 내용을 작성하세요.
`;

  fs.writeFileSync(filepath, content);
  console.log(`새 포스트 생성: posts/${filename}`);
  return filepath;
}

module.exports = { createPost };

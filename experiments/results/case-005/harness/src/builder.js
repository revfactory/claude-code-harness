'use strict';

/**
 * 빌드 오케스트레이터
 * posts/*.md -> dist/ 정적 사이트 생성
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter');
const { convertMarkdown } = require('./markdown');
const { render } = require('./template');

function build(projectRoot) {
  const postsDir = path.join(projectRoot, 'posts');
  const distDir = path.join(projectRoot, 'dist');
  const templatesDir = path.join(projectRoot, 'templates');

  // dist 디렉토리 초기화
  if (fs.existsSync(distDir)) {
    rmSync(distDir);
  }
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'posts'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'tags'), { recursive: true });

  // 템플릿 로드
  const layoutTpl = fs.readFileSync(path.join(templatesDir, 'layout.html'), 'utf-8');
  const postTpl = fs.readFileSync(path.join(templatesDir, 'post.html'), 'utf-8');
  const indexTpl = fs.readFileSync(path.join(templatesDir, 'index.html'), 'utf-8');
  const tagTpl = fs.readFileSync(path.join(templatesDir, 'tag.html'), 'utf-8');
  const tagsIndexTpl = fs.readFileSync(path.join(templatesDir, 'tags-index.html'), 'utf-8');

  const baseUrl = '.';

  // 포스트 수집
  if (!fs.existsSync(postsDir)) {
    console.log('posts/ 디렉토리가 없습니다.');
    return;
  }

  const mdFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  if (mdFiles.length === 0) {
    console.log('포스트가 없습니다.');
    return;
  }

  const posts = [];
  const tagMap = {};

  for (const file of mdFiles) {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const { attributes, body } = parseFrontmatter(raw);
    const htmlBody = convertMarkdown(body);
    const slug = path.basename(file, '.md');

    const post = {
      title: attributes.title || slug,
      date: attributes.date || '1970-01-01',
      tags: Array.isArray(attributes.tags) ? attributes.tags : (attributes.tags ? [attributes.tags] : []),
      description: attributes.description || '',
      slug,
      body: htmlBody,
    };

    posts.push(post);

    // 태그 수집
    for (const tag of post.tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(post);
    }
  }

  // 날짜순 정렬 (최신 먼저)
  posts.sort((a, b) => b.date.localeCompare(a.date));

  // 개별 포스트 페이지 생성
  for (const post of posts) {
    const postContent = render(postTpl, { ...post, baseUrl: '..' });
    const page = render(layoutTpl, {
      title: post.title,
      content: postContent,
      baseUrl: '..',
    });
    fs.writeFileSync(path.join(distDir, 'posts', `${post.slug}.html`), page);
  }

  // 인덱스 페이지 생성
  const indexContent = render(indexTpl, { posts, baseUrl });
  const indexPage = render(layoutTpl, {
    title: 'Blog',
    content: indexContent,
    baseUrl,
  });
  fs.writeFileSync(path.join(distDir, 'index.html'), indexPage);

  // 태그별 페이지 생성
  for (const [tagName, tagPosts] of Object.entries(tagMap)) {
    tagPosts.sort((a, b) => b.date.localeCompare(a.date));
    const tagContent = render(tagTpl, {
      tagName,
      postCount: tagPosts.length,
      posts: tagPosts,
      baseUrl: '..',
    });
    const tagPage = render(layoutTpl, {
      title: `Tag: ${tagName}`,
      content: tagContent,
      baseUrl: '..',
    });
    fs.writeFileSync(path.join(distDir, 'tags', `${tagName}.html`), tagPage);
  }

  // 태그 인덱스 페이지 생성
  const tagsData = Object.entries(tagMap)
    .map(([name, p]) => ({ name, count: p.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const tagsContent = render(tagsIndexTpl, { tags: tagsData, baseUrl });
  const tagsPage = render(layoutTpl, {
    title: 'Tags',
    content: tagsContent,
    baseUrl,
  });
  fs.writeFileSync(path.join(distDir, 'tags.html'), tagsPage);

  // CSS 생성
  generateCSS(distDir);

  console.log(`빌드 완료: ${posts.length}개 포스트, ${Object.keys(tagMap).length}개 태그`);
  return { posts: posts.length, tags: Object.keys(tagMap).length };
}

function generateCSS(distDir) {
  const css = `/* Blog Generator CSS */
:root {
  --primary: #2563eb;
  --text: #1f2937;
  --bg: #ffffff;
  --gray: #6b7280;
  --light-gray: #f3f4f6;
  --border: #e5e7eb;
  --code-bg: #1e293b;
  --code-text: #e2e8f0;
  --max-width: 48rem;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.7;
}

header {
  border-bottom: 1px solid var(--border);
  padding: 1rem 2rem;
}

header nav {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
}

.nav-links a {
  color: var(--gray);
  text-decoration: none;
  margin-left: 1.5rem;
  transition: color 0.2s;
}

.nav-links a:hover { color: var(--primary); }

main {
  max-width: var(--max-width);
  margin: 2rem auto;
  padding: 0 2rem;
}

footer {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
  font-size: 0.875rem;
  border-top: 1px solid var(--border);
  margin-top: 4rem;
}

h1 { font-size: 2rem; margin-bottom: 1rem; }
h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; }
h3 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }

p { margin-bottom: 1rem; }

a { color: var(--primary); }

.post-header { margin-bottom: 2rem; }
.post-meta {
  color: var(--gray);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.post-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.tag {
  display: inline-block;
  background: var(--light-gray);
  color: var(--gray);
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  text-decoration: none;
  transition: background 0.2s;
}
.tag:hover { background: var(--border); color: var(--text); }

.post-summary {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--border);
}
.post-summary h2 { margin: 0 0 0.25rem; font-size: 1.25rem; }
.post-summary h2 a { text-decoration: none; color: var(--text); }
.post-summary h2 a:hover { color: var(--primary); }
.post-description { color: var(--gray); margin-top: 0.5rem; }

.post-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }

blockquote {
  border-left: 4px solid var(--primary);
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  background: var(--light-gray);
  color: var(--gray);
}

pre {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

code {
  font-family: 'SF Mono', 'Fira Code', monospace;
}

p code, li code {
  background: var(--light-gray);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.hl-keyword { color: #c084fc; font-weight: bold; }
.hl-string { color: #86efac; }
.hl-comment { color: #64748b; font-style: italic; }
.hl-number { color: #fbbf24; }

ul, ol { margin: 1rem 0; padding-left: 2rem; }
li { margin-bottom: 0.25rem; }

hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }

.tags-cloud { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
.tag-cloud-item { font-size: 1rem; padding: 0.35rem 0.9rem; }

@media (max-width: 640px) {
  main { padding: 0 1rem; }
  header { padding: 1rem; }
  h1 { font-size: 1.5rem; }
}
`;
  fs.writeFileSync(path.join(distDir, 'style.css'), css);
}

function rmSync(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      rmSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dirPath);
}

module.exports = { build };

#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const DIST_DIR = path.join(ROOT, 'dist');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// ─── YAML Frontmatter Parser ────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // Handle arrays like [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    // Handle quoted strings
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    meta[key] = value;
  }

  return { meta, body: match[2] };
}

// ─── Markdown to HTML Converter ─────────────────────────────────────────────

function markdownToHtml(md) {
  let html = md;

  // Code blocks with language (``` lang ... ```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    const highlighted = lang ? highlightCode(escaped, lang) : escaped;
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${highlighted}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquote
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/(^[\t ]*[-*]\s+.+$(\n|$))+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const text = line.replace(/^[\t ]*[-*]\s+/, '');
      return `  <li>${text}</li>`;
    });
    return `<ul>\n${items.join('\n')}\n</ul>`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\.\s+.+$(\n|$))+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const text = line.replace(/^\d+\.\s+/, '');
      return `  <li>${text}</li>`;
    });
    return `<ol>\n${items.join('\n')}\n</ol>`;
  });

  // Paragraphs: wrap standalone text lines
  const lines = html.split('\n');
  const result = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('<pre') || trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') || trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<h') || trimmed.startsWith('<hr')) {
      inBlock = true;
    }

    if (inBlock) {
      result.push(line);
      if (trimmed.startsWith('</pre') || trimmed.startsWith('</ul') ||
          trimmed.startsWith('</ol') || trimmed.startsWith('</blockquote') ||
          trimmed.match(/^<h\d>.*<\/h\d>$/) || trimmed === '<hr>') {
        inBlock = false;
      }
      continue;
    }

    if (trimmed === '') {
      result.push('');
    } else if (!trimmed.startsWith('<')) {
      result.push(`<p>${trimmed}</p>`);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Syntax Highlighting (simple keyword-based) ─────────────────────────────

const KEYWORDS = {
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'import', 'export', 'default', 'from', 'new', 'this', 'async', 'await',
    'try', 'catch', 'throw', 'switch', 'case', 'break', 'continue', 'typeof', 'instanceof',
    'true', 'false', 'null', 'undefined', 'of', 'in', 'yield'],
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for',
    'while', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'raise',
    'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'pass', 'break', 'continue',
    'async', 'await', 'self'],
  rust: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'pub', 'use',
    'mod', 'self', 'super', 'crate', 'return', 'if', 'else', 'for', 'while', 'loop',
    'match', 'break', 'continue', 'move', 'async', 'await', 'where', 'true', 'false'],
  html: [],
  css: [],
};

function highlightCode(escaped, lang) {
  const keywords = KEYWORDS[lang] || KEYWORDS['javascript'] || [];
  let result = escaped;

  // Highlight strings (already escaped, so &quot; represents ")
  result = result.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|'[^']*'|"[^"]*")/g,
    '<span class="hl-string">$1</span>');

  // Highlight single-line comments
  result = result.replace(/(\/\/.*$|#(?!include).*$)/gm,
    '<span class="hl-comment">$1</span>');

  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g,
    '<span class="hl-number">$1</span>');

  // Highlight keywords
  if (keywords.length > 0) {
    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    result = result.replace(pattern, '<span class="hl-keyword">$1</span>');
  }

  return result;
}

// ─── Template Engine ────────────────────────────────────────────────────────

function loadTemplate(name) {
  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  return fs.readFileSync(filePath, 'utf-8');
}

function renderTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// ─── Post Loading ───────────────────────────────────────────────────────────

function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = file.replace(/\.md$/, '');
    const htmlContent = markdownToHtml(body);
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);

    posts.push({
      slug,
      title: meta.title || slug,
      date: meta.date || '1970-01-01',
      tags,
      author: meta.author || 'Anonymous',
      description: meta.description || '',
      content: htmlContent,
    });
  }

  // Sort by date descending
  posts.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  return posts;
}

// ─── Build Command ──────────────────────────────────────────────────────────

function build() {
  console.log('Building site...');

  // Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'posts'), { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'tags'), { recursive: true });

  const posts = loadPosts();
  const layoutTemplate = loadTemplate('layout');
  const indexTemplate = loadTemplate('index');
  const postTemplate = loadTemplate('post');
  const tagTemplate = loadTemplate('tag');

  // Collect all tags
  const tagMap = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(post);
    }
  }

  // Generate post list HTML
  function postListHtml(postList) {
    return postList.map(p => {
      const tagLinks = p.tags.map(t =>
        `<a href="/tags/${t}.html" class="tag">${t}</a>`
      ).join(' ');
      return `<article class="post-summary">
  <h2><a href="/posts/${p.slug}.html">${p.title}</a></h2>
  <div class="post-meta">
    <time datetime="${p.date}">${p.date}</time>
    <span class="author">by ${p.author}</span>
  </div>
  ${p.description ? `<p class="description">${p.description}</p>` : ''}
  <div class="tags">${tagLinks}</div>
</article>`;
    }).join('\n');
  }

  // Generate tag navigation
  const tagNav = Object.keys(tagMap).sort().map(tag =>
    `<a href="/tags/${tag}.html" class="tag">${tag} (${tagMap[tag].length})</a>`
  ).join(' ');

  // Build index page
  const indexContent = renderTemplate(indexTemplate, {
    posts: postListHtml(posts),
    tags: tagNav,
  });
  const indexPage = renderTemplate(layoutTemplate, {
    title: 'Blog',
    content: indexContent,
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexPage);
  console.log('  -> dist/index.html');

  // Build individual post pages
  for (const post of posts) {
    const tagLinks = post.tags.map(t =>
      `<a href="/tags/${t}.html" class="tag">${t}</a>`
    ).join(' ');

    const postContent = renderTemplate(postTemplate, {
      title: post.title,
      date: post.date,
      author: post.author,
      tags: tagLinks,
      content: post.content,
    });
    const postPage = renderTemplate(layoutTemplate, {
      title: post.title,
      content: postContent,
    });
    fs.writeFileSync(path.join(DIST_DIR, 'posts', `${post.slug}.html`), postPage);
    console.log(`  -> dist/posts/${post.slug}.html`);
  }

  // Build tag pages
  for (const [tag, tagPosts] of Object.entries(tagMap)) {
    const tagContent = renderTemplate(tagTemplate, {
      tag,
      count: String(tagPosts.length),
      posts: postListHtml(tagPosts),
    });
    const tagPage = renderTemplate(layoutTemplate, {
      title: `Tag: ${tag}`,
      content: tagContent,
    });
    fs.writeFileSync(path.join(DIST_DIR, 'tags', `${tag}.html`), tagPage);
    console.log(`  -> dist/tags/${tag}.html`);
  }

  // Copy styles
  const stylesSrc = path.join(TEMPLATES_DIR, 'styles.css');
  if (fs.existsSync(stylesSrc)) {
    fs.copyFileSync(stylesSrc, path.join(DIST_DIR, 'styles.css'));
    console.log('  -> dist/styles.css');
  }

  console.log(`\nBuild complete! ${posts.length} posts generated.`);
}

// ─── New Post Command ───────────────────────────────────────────────────────

function newPost(title) {
  if (!title) {
    console.error('Usage: blog new <title>');
    process.exit(1);
  }

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const filename = `${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.error(`Post already exists: ${filename}`);
    process.exit(1);
  }

  const content = `---
title: ${title}
date: ${date}
author: Author
tags: [blog]
description: A new blog post
---

# ${title}

Write your content here.
`;

  fs.writeFileSync(filepath, content);
  console.log(`Created new post: posts/${filename}`);
}

// ─── Serve Command ──────────────────────────────────────────────────────────

function serve(port = 3000) {
  if (!fs.existsSync(DIST_DIR)) {
    console.log('dist/ not found. Running build first...');
    build();
  }

  const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    if (!path.extname(urlPath)) urlPath += '.html';

    const filePath = path.join(DIST_DIR, urlPath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Not Found</h1>');
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>500 - Server Error</h1>');
    }
  });

  server.listen(port, () => {
    console.log(`Blog server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop.');
  });
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'build':
    build();
    break;
  case 'new':
    newPost(args.slice(1).join(' '));
    break;
  case 'serve':
    serve(args[1] ? parseInt(args[1], 10) : 3000);
    break;
  default:
    console.log(`
Markdown Blog Generator
=======================

Usage:
  node blog.js build          Build the static site
  node blog.js new <title>    Create a new blog post
  node blog.js serve [port]   Serve the built site (default: 3000)

Structure:
  posts/      Markdown source files
  dist/       Generated HTML output
  templates/  HTML templates
`);
    break;
}

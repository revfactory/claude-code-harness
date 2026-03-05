'use strict';

/**
 * 로컬 개발 서버 (순수 Node.js http 모듈)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serve(projectRoot, port) {
  port = port || 3000;
  const distDir = path.join(projectRoot, 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('dist/ 디렉토리가 없습니다. 먼저 blog build를 실행하세요.');
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    if (!path.extname(urlPath)) urlPath += '.html';

    const filePath = path.join(distDir, urlPath);

    // 경로 탈출 방지
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 - Not Found</h1>');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.listen(port, () => {
    console.log(`개발 서버 시작: http://localhost:${port}`);
    console.log('종료하려면 Ctrl+C를 누르세요.');
  });

  return server;
}

module.exports = { serve };

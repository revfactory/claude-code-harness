'use strict';

/**
 * 마크다운 -> HTML 변환기
 * 순수 Node.js, 외부 의존성 없음
 */

const { highlight, escapeHtml } = require('./highlight');

function convertMarkdown(md) {
  let html = '';
  const lines = md.split('\n');
  let i = 0;
  let inList = null; // 'ul' | 'ol' | null
  let listBuffer = [];

  function flushList() {
    if (inList && listBuffer.length > 0) {
      html += `<${inList}>\n${listBuffer.join('\n')}\n</${inList}>\n`;
      listBuffer = [];
      inList = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    // 코드 블록
    if (line.startsWith('```')) {
      flushList();
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const code = codeLines.join('\n');
      const highlighted = lang ? highlight(code, lang) : escapeHtml(code);
      const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
      html += `<pre><code${langAttr}>${highlighted}</code></pre>\n`;
      continue;
    }

    // 빈 줄
    if (line.trim() === '') {
      flushList();
      i++;
      continue;
    }

    // 헤딩
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      html += `<h${level}>${text}</h${level}>\n`;
      i++;
      continue;
    }

    // 수평선
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      html += '<hr>\n';
      i++;
      continue;
    }

    // 인용
    if (line.startsWith('>')) {
      flushList();
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      html += `<blockquote><p>${processInline(quoteLines.join('\n'))}</p></blockquote>\n`;
      continue;
    }

    // 순서 없는 리스트
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listBuffer.push(`<li>${processInline(ulMatch[1])}</li>`);
      i++;
      continue;
    }

    // 순서 있는 리스트
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listBuffer.push(`<li>${processInline(olMatch[1])}</li>`);
      i++;
      continue;
    }

    // 일반 단락
    flushList();
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' &&
           !lines[i].startsWith('#') && !lines[i].startsWith('```') &&
           !lines[i].startsWith('>') && !lines[i].match(/^[-*+]\s/) &&
           !lines[i].match(/^\d+\.\s/) && !lines[i].match(/^(-{3,}|_{3,}|\*{3,})$/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html += `<p>${processInline(paraLines.join('\n'))}</p>\n`;
    }
  }

  flushList();
  return html;
}

function processInline(text) {
  let result = text;

  // 이미지 (링크보다 먼저 처리)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // 링크
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 인라인 코드
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 볼드
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 이탤릭
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 줄바꿈
  result = result.replace(/\n/g, '<br>\n');

  return result;
}

module.exports = { convertMarkdown, processInline };

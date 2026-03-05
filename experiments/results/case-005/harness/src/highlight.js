'use strict';

/**
 * 코드 구문 하이라이팅
 * 키워드, 문자열, 주석, 숫자 등을 <span> 태그로 감싼다.
 */

const KEYWORDS = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'default', 'from', 'async', 'await',
    'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of',
    'true', 'false', 'null', 'undefined', 'yield', 'static', 'super',
  ],
  python: [
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import',
    'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield',
    'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'in',
    'True', 'False', 'None', 'self', 'async', 'await', 'print',
  ],
  html: [
    'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'form',
    'input', 'button', 'script', 'style', 'link', 'meta', 'title',
  ],
  css: [
    'color', 'background', 'margin', 'padding', 'border', 'font', 'display',
    'position', 'width', 'height', 'top', 'left', 'right', 'bottom', 'flex',
    'grid', 'align', 'justify', 'transform', 'transition', 'animation',
  ],
};

// JS/Python 계열 별칭
const LANG_ALIASES = {
  js: 'javascript',
  ts: 'javascript',
  typescript: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlight(code, lang) {
  const escaped = escapeHtml(code);
  const resolvedLang = LANG_ALIASES[lang] || lang;
  const keywords = KEYWORDS[resolvedLang];

  if (!keywords) {
    return escaped;
  }

  let result = escaped;

  // 문자열 하이라이팅 (큰/작은 따옴표, 백틱)
  result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g,
    match => `<span class="hl-string">${match}</span>`);

  // 한 줄 주석 하이라이팅
  result = result.replace(/(\/\/.*$|#(?!include).*$)/gm,
    match => `<span class="hl-comment">${match}</span>`);

  // 숫자 하이라이팅
  result = result.replace(/\b(\d+\.?\d*)\b/g,
    '<span class="hl-number">$1</span>');

  // 키워드 하이라이팅
  for (const kw of keywords) {
    const re = new RegExp(`\\b(${kw})\\b`, 'g');
    result = result.replace(re, '<span class="hl-keyword">$1</span>');
  }

  return result;
}

module.exports = { highlight, escapeHtml };

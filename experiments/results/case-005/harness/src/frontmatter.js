'use strict';

/**
 * YAML Frontmatter 파서
 * --- 구분자 사이의 YAML 메타데이터를 파싱한다.
 */

function parseFrontmatter(content) {
  const result = { attributes: {}, body: content };
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return result;

  const yamlStr = match[1];
  const body = match[2];
  const attributes = {};

  const lines = yamlStr.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    // 배열 처리: [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    // 따옴표 제거
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // boolean
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // number
    else if (/^\d+$/.test(value)) value = parseInt(value, 10);

    attributes[key] = value;
  }

  return { attributes, body };
}

module.exports = { parseFrontmatter };

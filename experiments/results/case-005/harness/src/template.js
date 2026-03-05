'use strict';

/**
 * 간이 템플릿 엔진
 * {{ variable }}, {{#each items}}...{{/each}}, {{#if cond}}...{{/if}} 지원
 */

function render(template, data) {
  let result = template;

  // {{#each items}} ... {{/each}} 처리 (중첩 지원)
  result = processBlock(result, 'each', (key, inner) => {
    const arr = resolveValue(data, key);
    if (!Array.isArray(arr)) return '';
    return arr.map((item, index) => {
      const itemData = typeof item === 'object'
        ? { ...data, ...item, '@index': index }
        : { ...data, this: item, '@index': index };
      return render(inner, itemData);
    }).join('');
  });

  // {{#if condition}} ... {{else}} ... {{/if}} 처리 (중첩 지원)
  result = processBlock(result, 'if', (key, inner) => {
    const val = resolveValue(data, key);
    // else 분리 (같은 깊이의 else만)
    const elseSplit = splitElse(inner);
    const truePart = elseSplit[0];
    const falsePart = elseSplit[1] || '';
    const truthy = Array.isArray(val) ? val.length > 0 : !!val;
    return truthy ? render(truePart, data) : render(falsePart, data);
  });

  // {{ variable }} 치환 (도트 표기법 지원)
  result = result.replace(/\{\{\s*([\w.@]+)\s*\}\}/g, (match, key) => {
    const val = resolveValue(data, key);
    return val !== undefined && val !== null ? String(val) : '';
  });

  return result;
}

/**
 * 중첩을 올바르게 처리하는 블록 파서
 */
function processBlock(template, blockType, handler) {
  const openTag = `{{#${blockType} `;
  let result = '';
  let pos = 0;

  while (pos < template.length) {
    const openIdx = template.indexOf(openTag, pos);
    if (openIdx === -1) {
      result += template.slice(pos);
      break;
    }

    result += template.slice(pos, openIdx);

    // 키 이름 추출
    const keyStart = openIdx + openTag.length;
    const keyEnd = template.indexOf('}}', keyStart);
    const key = template.slice(keyStart, keyEnd).trim();
    const bodyStart = keyEnd + 2;

    // 중첩 깊이를 추적하며 매칭되는 닫기 태그 찾기
    const closeTag = `{{/${blockType}}}`;
    let depth = 1;
    let searchPos = bodyStart;

    while (depth > 0 && searchPos < template.length) {
      const nextOpen = template.indexOf(openTag, searchPos);
      const nextClose = template.indexOf(closeTag, searchPos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        searchPos = nextOpen + openTag.length;
      } else {
        depth--;
        if (depth === 0) {
          const inner = template.slice(bodyStart, nextClose);
          result += handler(key, inner);
          pos = nextClose + closeTag.length;
        } else {
          searchPos = nextClose + closeTag.length;
        }
      }
    }

    if (depth > 0) {
      // 매칭 실패 시 원본 유지
      result += template.slice(openIdx, bodyStart);
      pos = bodyStart;
    }
  }

  return result;
}

/**
 * 같은 깊이의 {{else}} 기준으로 분리
 */
function splitElse(inner) {
  let depth = 0;
  let pos = 0;

  while (pos < inner.length) {
    if (inner.startsWith('{{#', pos)) {
      depth++;
      pos += 3;
    } else if (inner.startsWith('{{/', pos)) {
      depth--;
      pos += 3;
    } else if (depth === 0 && inner.startsWith('{{else}}', pos)) {
      return [inner.slice(0, pos), inner.slice(pos + 8)];
    } else {
      pos++;
    }
  }

  return [inner];
}

function resolveValue(data, keyPath) {
  const keys = keyPath.split('.');
  let current = data;
  for (const k of keys) {
    if (current == null) return undefined;
    current = current[k];
  }
  return current;
}

module.exports = { render };

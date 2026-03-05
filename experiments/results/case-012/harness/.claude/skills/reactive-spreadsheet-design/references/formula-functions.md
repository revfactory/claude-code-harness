# 내장 함수 명세

## 집계 함수
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| SUM | SUM(range) | 합계 |
| AVERAGE | AVERAGE(range) | 평균 |
| COUNT | COUNT(range) | 숫자 셀 개수 |
| MIN | MIN(range) | 최소값 |
| MAX | MAX(range) | 최대값 |

## 조건 함수
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| IF | IF(cond, then, else) | 조건 분기 |
| VLOOKUP | VLOOKUP(key, range, col_idx) | 수직 검색 |

## 문자열 함수
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| CONCATENATE | CONCATENATE(a, b, ...) | 문자열 연결 |
| LEN | LEN(text) | 길이 |
| UPPER | UPPER(text) | 대문자 변환 |
| LOWER | LOWER(text) | 소문자 변환 |
| LEFT | LEFT(text, n) | 왼쪽 n자 |
| RIGHT | RIGHT(text, n) | 오른쪽 n자 |
| MID | MID(text, start, len) | 중간 부분 |

## 수학 함수
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| ABS | ABS(num) | 절대값 |
| ROUND | ROUND(num, digits) | 반올림 |

## 함수 구현 패턴
```javascript
const functions = {
  SUM: (args, sheet) => {
    const values = flattenRanges(args, sheet);
    return values.filter(isNumber).reduce((a, b) => a + b, 0);
  },
  IF: (args, sheet) => {
    const [cond, thenVal, elseVal] = args;
    return evaluate(cond, sheet) ? evaluate(thenVal, sheet) : evaluate(elseVal, sheet);
  },
  VLOOKUP: (args, sheet) => {
    const [key, range, colIdx] = args.map(a => evaluate(a, sheet));
    const data = getRangeValues(range, sheet);
    const row = data.find(r => r[0] === key);
    if (!row) return { error: '#N/A' };
    return row[colIdx - 1];
  }
};
```

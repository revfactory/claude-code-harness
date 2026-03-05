# datekit

[![npm version](https://img.shields.io/npm/v/datekit.svg)](https://www.npmjs.com/package/datekit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/datekit)](https://bundlephobia.com/package/datekit)
[![license](https://img.shields.io/npm/l/datekit.svg)](https://github.com/datekit/datekit/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue.svg)](https://www.typescriptlang.org/)
[![downloads](https://img.shields.io/npm/dm/datekit.svg)](https://www.npmjs.com/package/datekit)

---

## 핵심 특징

- **경량** — 3KB 미만 (gzipped), 의존성 제로
- **범용** — 브라우저와 Node.js 환경 모두 지원
- **TypeScript 지원** — 타입 정의 내장, 별도 `@types` 설치 불필요
- **직관적 API** — 6개의 핵심 함수로 날짜 포맷, 파싱, 비교, 연산, 검증, 상대 시간 표현까지 처리
- **불변성** — 원본 Date 객체를 변경하지 않고 항상 새로운 값을 반환

---

## 설치

```bash
npm install datekit
```

```bash
yarn add datekit
```

```bash
pnpm add datekit
```

---

## Quick Start

```js
import { format, parse, diff, add, isValid, relative } from 'datekit';

// 날짜 포맷팅
format(new Date(), 'YYYY-MM-DD');
// → "2026-03-05"

// 문자열을 Date로 파싱
const date = parse('2026-03-05', 'YYYY-MM-DD');

// 두 날짜 간 차이 계산
diff(new Date(2026, 0, 1), new Date(2026, 2, 5), 'days');
// → 63

// 날짜에 값 더하기
add(new Date(), 7, 'days');
// → 7일 후의 Date 객체

// 유효성 검사
isValid(new Date('invalid'));
// → false

// 상대 시간 표현
relative(new Date(Date.now() - 60000));
// → "1분 전"
```

---

## 전체 API 문서

### `format(date, pattern)`

Date 객체를 지정한 패턴 문자열로 포맷팅합니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `date` | `Date` | 포맷팅할 Date 객체 |
| `pattern` | `string` | 포맷 패턴 문자열 |

**반환값:** `string` — 포맷팅된 날짜 문자열

**지원 패턴 토큰:**

| 토큰 | 출력 | 예시 |
|------|------|------|
| `YYYY` | 4자리 연도 | `2026` |
| `MM` | 2자리 월 | `03` |
| `DD` | 2자리 일 | `05` |
| `HH` | 2자리 시 (24시간) | `14` |
| `mm` | 2자리 분 | `30` |
| `ss` | 2자리 초 | `09` |

```js
format(new Date(2026, 2, 5, 14, 30, 9), 'YYYY-MM-DD HH:mm:ss');
// → "2026-03-05 14:30:09"

format(new Date(2026, 2, 5), 'YYYY/MM/DD');
// → "2026/03/05"

format(new Date(2026, 2, 5), 'DD.MM.YYYY');
// → "05.03.2026"
```

---

### `parse(str, pattern)`

문자열을 지정한 패턴에 따라 Date 객체로 파싱합니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `str` | `string` | 파싱할 날짜 문자열 |
| `pattern` | `string` | 문자열의 포맷 패턴 |

**반환값:** `Date` — 파싱된 Date 객체

```js
parse('2026-03-05', 'YYYY-MM-DD');
// → Date(2026, 2, 5)

parse('05/03/2026', 'DD/MM/YYYY');
// → Date(2026, 2, 5)

parse('2026-03-05 14:30:00', 'YYYY-MM-DD HH:mm:ss');
// → Date(2026, 2, 5, 14, 30, 0)
```

---

### `diff(date1, date2, unit)`

두 날짜 사이의 차이를 지정한 단위로 계산합니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `date1` | `Date` | 시작 날짜 |
| `date2` | `Date` | 종료 날짜 |
| `unit` | `string` | 차이 단위: `"years"`, `"months"`, `"days"`, `"hours"`, `"minutes"`, `"seconds"` |

**반환값:** `number` — 두 날짜 간 차이 (정수)

```js
const start = new Date(2026, 0, 1);
const end = new Date(2026, 11, 31);

diff(start, end, 'days');
// → 364

diff(start, end, 'months');
// → 11

diff(start, end, 'years');
// → 0
```

---

### `add(date, amount, unit)`

날짜에 지정한 양만큼 더하여 새로운 Date 객체를 반환합니다. 원본 Date는 변경되지 않습니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `date` | `Date` | 기준 날짜 |
| `amount` | `number` | 더할 양 (음수로 빼기 가능) |
| `unit` | `string` | 단위: `"years"`, `"months"`, `"days"`, `"hours"`, `"minutes"`, `"seconds"` |

**반환값:** `Date` — 새로운 Date 객체

```js
const today = new Date(2026, 2, 5);

add(today, 7, 'days');
// → Date(2026, 2, 12)

add(today, -1, 'months');
// → Date(2026, 1, 5)

add(today, 2, 'years');
// → Date(2028, 2, 5)
```

---

### `isValid(date)`

주어진 값이 유효한 Date 객체인지 검사합니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `date` | `any` | 검사할 값 |

**반환값:** `boolean` — 유효하면 `true`, 아니면 `false`

```js
isValid(new Date());
// → true

isValid(new Date('2026-03-05'));
// → true

isValid(new Date('invalid'));
// → false

isValid('2026-03-05');
// → false

isValid(null);
// → false
```

---

### `relative(date[, baseDate])`

주어진 날짜를 현재 시점(또는 기준 날짜) 대비 상대적 시간 표현으로 반환합니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `date` | `Date` | 표현할 날짜 |
| `baseDate` | `Date` (선택) | 비교 기준 날짜. 생략 시 현재 시각 |

**반환값:** `string` — 상대 시간 문자열

```js
const now = new Date(2026, 2, 5, 12, 0, 0);

relative(new Date(2026, 2, 5, 11, 59, 0), now);
// → "1분 전"

relative(new Date(2026, 2, 5, 9, 0, 0), now);
// → "3시간 전"

relative(new Date(2026, 2, 3, 12, 0, 0), now);
// → "2일 전"

relative(new Date(2026, 5, 5, 12, 0, 0), now);
// → "3개월 후"
```

---

## TypeScript

datekit은 타입 정의를 내장하고 있어 별도의 `@types` 패키지 설치가 필요 없습니다.

```ts
import { format, parse, diff, add, isValid, relative } from 'datekit';

const formatted: string = format(new Date(), 'YYYY-MM-DD');
const parsed: Date = parse('2026-03-05', 'YYYY-MM-DD');
const delta: number = diff(new Date(), parsed, 'days');
const future: Date = add(new Date(), 30, 'days');
const valid: boolean = isValid(new Date());
const rel: string = relative(parsed);
```

### 타입 정의

```ts
type DateUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';

declare function format(date: Date, pattern: string): string;
declare function parse(str: string, pattern: string): Date;
declare function diff(date1: Date, date2: Date, unit: DateUnit): number;
declare function add(date: Date, amount: number, unit: DateUnit): Date;
declare function isValid(date: any): boolean;
declare function relative(date: Date, baseDate?: Date): string;
```

---

## 브라우저 CDN

CDN을 통해 별도 빌드 과정 없이 브라우저에서 바로 사용할 수 있습니다.

### unpkg

```html
<script src="https://unpkg.com/datekit/dist/datekit.umd.js"></script>
```

### jsDelivr

```html
<script src="https://cdn.jsdelivr.net/npm/datekit/dist/datekit.umd.js"></script>
```

### 사용 예시

```html
<script src="https://unpkg.com/datekit/dist/datekit.umd.js"></script>
<script>
  const { format, parse, diff, add, isValid, relative } = datekit;

  document.getElementById('today').textContent = format(new Date(), 'YYYY-MM-DD');
</script>
```

ES 모듈 방식:

```html
<script type="module">
  import { format, relative } from 'https://unpkg.com/datekit/dist/datekit.esm.js';

  console.log(format(new Date(), 'YYYY-MM-DD'));
  console.log(relative(new Date(Date.now() - 3600000)));
</script>
```

---

## 기여 가이드

datekit에 기여해 주셔서 감사합니다! 다음 절차를 따라 주세요.

### 개발 환경 설정

```bash
git clone https://github.com/datekit/datekit.git
cd datekit
npm install
```

### 개발 워크플로우

1. 이슈를 먼저 확인하거나 새로운 이슈를 생성합니다.
2. `main` 브랜치에서 feature 브랜치를 생성합니다.

```bash
git checkout -b feature/my-feature
```

3. 변경 사항을 구현하고 테스트를 작성합니다.

```bash
npm test
```

4. 린트를 통과하는지 확인합니다.

```bash
npm run lint
```

5. 커밋하고 Pull Request를 생성합니다.

```bash
git commit -m "Add my feature"
git push origin feature/my-feature
```

### 가이드라인

- 모든 새로운 기능에는 테스트를 포함해 주세요.
- 기존 코드 스타일을 따라 주세요.
- PR 설명에 변경 사항의 목적과 내용을 명확히 기술해 주세요.
- 의존성 추가는 지양합니다 — datekit의 핵심 가치는 "의존성 제로"입니다.

---

## 라이선스

MIT License

Copyright (c) datekit contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

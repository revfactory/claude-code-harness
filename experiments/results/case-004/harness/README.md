# datekit

[![npm version](https://img.shields.io/npm/v/datekit.svg)](https://www.npmjs.com/package/datekit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/datekit?label=gzip)](https://bundlephobia.com/package/datekit)
[![license](https://img.shields.io/npm/l/datekit.svg)](https://github.com/datekit/datekit/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue.svg)](https://www.typescriptlang.org/)

Lightweight date utility for JavaScript. Zero dependencies, < 3 KB gzipped, works in browsers and Node.js.

## Core Features

- **Zero dependencies** -- no bloat, no supply-chain risk
- **Tiny footprint** -- under 3 KB gzipped
- **Isomorphic** -- runs in Node.js, browsers, Deno, Bun
- **TypeScript ready** -- ships with built-in type declarations
- **Intuitive API** -- six composable functions cover most date tasks
- **Immutable** -- never mutates the Date objects you pass in

## Installation

```bash
# npm
npm install datekit

# yarn
yarn add datekit

# pnpm
pnpm add datekit
```

## Quick Start

```javascript
import { format, parse, diff, add, isValid, relative } from 'datekit';

// Format a date
format(new Date(2026, 2, 5, 14, 30), 'YYYY-MM-DD HH:mm');
// => '2026-03-05 14:30'

// Parse a string into a Date
parse('2026-03-05', 'YYYY-MM-DD');
// => Date object: 2026-03-05T00:00:00

// Difference between two dates
diff(new Date(2026, 2, 5), new Date(2026, 2, 1), 'days');
// => 4

// Add time to a date
add(new Date(2026, 2, 5), 7, 'days');
// => Date object: 2026-03-12T00:00:00

// Validate a date
isValid(new Date('invalid'));
// => false

// Relative time description
relative(new Date(2026, 2, 5), new Date(2026, 2, 6));
// => '1 day ago'
```

## API Reference

### `format(date, pattern)`

Format a Date object into a string using the given pattern.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| date | `Date` | Yes | The Date object to format |
| pattern | `string` | Yes | The format pattern string |

**Returns**

`string` -- The formatted date string.

**Format Tokens**

| Token | Output | Example |
|-------|--------|---------|
| `YYYY` | 4-digit year | 2026 |
| `YY` | 2-digit year | 26 |
| `MM` | 2-digit month (01-12) | 03 |
| `M` | Month (1-12) | 3 |
| `DD` | 2-digit day (01-31) | 05 |
| `D` | Day (1-31) | 5 |
| `HH` | 24-hour (00-23) | 14 |
| `H` | 24-hour (0-23) | 14 |
| `hh` | 12-hour (01-12) | 02 |
| `h` | 12-hour (1-12) | 2 |
| `mm` | Minutes (00-59) | 30 |
| `ss` | Seconds (00-59) | 45 |
| `SSS` | Milliseconds (000-999) | 123 |
| `A` | AM/PM | PM |
| `a` | am/pm | pm |
| `dddd` | Weekday (full) | Wednesday |
| `ddd` | Weekday (short) | Wed |

**Example**

```javascript
const date = new Date(2026, 2, 5, 14, 30, 45, 123);

format(date, 'YYYY-MM-DD');
// => '2026-03-05'

format(date, 'HH:mm:ss.SSS');
// => '14:30:45.123'

format(date, 'dddd, MMMM D, YYYY h:mm A');
// => 'Thursday, March 5, 2026 2:30 PM'

format(date, 'YY/M/D');
// => '26/3/5'
```

---

### `parse(str, pattern)`

Parse a date string into a Date object according to the given pattern.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| str | `string` | Yes | The date string to parse |
| pattern | `string` | Yes | The format pattern matching the string |

**Returns**

`Date` -- A Date object parsed from the string. Returns an invalid Date if the string does not match the pattern.

**Example**

```javascript
parse('2026-03-05', 'YYYY-MM-DD');
// => Date object: 2026-03-05T00:00:00

parse('05/03/2026 14:30', 'DD/MM/YYYY HH:mm');
// => Date object: 2026-03-05T14:30:00

parse('March 5, 2026', 'MMMM D, YYYY');
// => Date object: 2026-03-05T00:00:00
```

---

### `diff(date1, date2, unit)`

Calculate the difference between two dates in the specified unit.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| date1 | `Date` | Yes | The first date |
| date2 | `Date` | Yes | The second date |
| unit | `string` | Yes | Unit of measurement: `'years'`, `'months'`, `'days'`, `'hours'`, `'minutes'`, `'seconds'`, `'milliseconds'` |

**Returns**

`number` -- The difference as a numeric value. Returns a negative number when `date1` is earlier than `date2`.

**Example**

```javascript
const a = new Date(2026, 2, 5);
const b = new Date(2026, 0, 1);

diff(a, b, 'days');
// => 63

diff(b, a, 'days');
// => -63

diff(a, b, 'months');
// => 2
```

---

### `add(date, amount, unit)`

Return a new Date with the specified amount of time added. The original Date is not mutated.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| date | `Date` | Yes | The base date |
| amount | `number` | Yes | The amount to add. Use negative values to subtract. |
| unit | `string` | Yes | Unit of time: `'years'`, `'months'`, `'days'`, `'hours'`, `'minutes'`, `'seconds'`, `'milliseconds'` |

**Returns**

`Date` -- A new Date object with the time added.

**Example**

```javascript
const date = new Date(2026, 2, 5);

add(date, 7, 'days');
// => Date object: 2026-03-12T00:00:00

add(date, -1, 'months');
// => Date object: 2026-02-05T00:00:00

add(date, 2, 'years');
// => Date object: 2028-03-05T00:00:00
```

---

### `isValid(date)`

Check whether a value is a valid Date object.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| date | `any` | Yes | The value to check |

**Returns**

`boolean` -- `true` if the value is a valid Date, `false` otherwise.

**Example**

```javascript
isValid(new Date(2026, 2, 5));
// => true

isValid(new Date('invalid'));
// => false

isValid('2026-03-05');
// => false

isValid(null);
// => false
```

---

### `relative(date[, baseDate])`

Return a human-readable string describing the time difference between `date` and `baseDate`.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| date | `Date` | Yes | The target date |
| baseDate | `Date` | No | The reference date. Default: `new Date()` (now) |

**Returns**

`string` -- A human-readable relative time string such as `'3 days ago'` or `'in 2 hours'`.

**Example**

```javascript
const base = new Date(2026, 2, 5, 12, 0, 0);

relative(new Date(2026, 2, 4, 12, 0, 0), base);
// => '1 day ago'

relative(new Date(2026, 2, 8, 12, 0, 0), base);
// => 'in 3 days'

relative(new Date(2026, 2, 5, 10, 0, 0), base);
// => '2 hours ago'

// Without baseDate, compares against current time
relative(new Date(2026, 2, 4));
// => '1 day ago' (when run on 2026-03-05)
```

## TypeScript

datekit ships with built-in TypeScript declarations. No additional `@types` package is needed.

```typescript
import { format, parse, diff, add, isValid, relative } from 'datekit';

const formatted: string = format(new Date(), 'YYYY-MM-DD');
const parsed: Date = parse('2026-03-05', 'YYYY-MM-DD');
const days: number = diff(new Date(), parsed, 'days');
const future: Date = add(new Date(), 30, 'days');
const valid: boolean = isValid(parsed);
const ago: string = relative(parsed);
```

Type definitions for the unit parameter:

```typescript
type DateUnit =
  | 'years'
  | 'months'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';
```

## Browser / CDN

### ES Module

```html
<script type="module">
  import { format } from 'https://cdn.jsdelivr.net/npm/datekit/+esm';
  console.log(format(new Date(), 'YYYY-MM-DD'));
</script>
```

### UMD

```html
<script src="https://cdn.jsdelivr.net/npm/datekit/dist/datekit.umd.min.js"></script>
<script>
  const { format } = window.datekit;
  console.log(format(new Date(), 'YYYY-MM-DD'));
</script>
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Write tests for your changes
4. Make sure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feat/my-feature`
7. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/datekit/datekit.git
cd datekit
npm install
npm test
```

### Code Style

- ESLint + Prettier enforced via CI
- 100% test coverage expected for new code
- Keep the bundle under 3 KB gzipped

## License

[MIT](./LICENSE)

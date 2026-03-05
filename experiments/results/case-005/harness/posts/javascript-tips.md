---
title: JavaScript 유용한 팁
date: 2026-03-03
tags: [javascript, programming]
description: JavaScript 개발에 유용한 팁 모음입니다.
---

# JavaScript 유용한 팁

JavaScript 개발에서 자주 사용하는 패턴들을 소개합니다.

## 구조 분해 할당

```javascript
const { name, age } = person;
const [first, ...rest] = items;
```

## 옵셔널 체이닝

```javascript
const value = obj?.nested?.property;
const result = arr?.[0]?.name;
```

## 유용한 배열 메서드

1. `map()` - 변환
2. `filter()` - 필터링
3. `reduce()` - 축약

```javascript
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

이 패턴들을 잘 활용하면 **더 깔끔한 코드**를 작성할 수 있습니다.

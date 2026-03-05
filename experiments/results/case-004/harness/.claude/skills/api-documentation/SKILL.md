---
name: api-documentation
description: Write accurate and complete library API documentation. Use when creating API docs, README files, or function reference documentation. Ensures all signatures, parameters, return types, and examples are precise.
---

# API Documentation

## 문서 작성 워크플로우

1. 소스 코드에서 모든 public 함수 시그니처 추출
2. 각 함수의 파라미터 (필수/선택) 및 반환값 타입 확인
3. 함수 문서 템플릿에 맞춰 작성
4. format 토큰 등 열거형 값은 전수 나열
5. 예제 코드는 실제 동작과 일치하도록 작성
6. 정확성 체크리스트로 최종 검증

## 함수 문서 템플릿

```markdown
### `functionName(param1, param2[, optionalParam])`

설명 한 문장.

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | `Type` | Yes | 설명 |
| optionalParam | `Type` | No | 설명. 기본값: `default` |

**Returns**

`ReturnType` - 설명

**Example**

\`\`\`javascript
const result = functionName('input');
// => 'expected output'
\`\`\`
```

## 정확성 체크리스트

- 모든 함수의 선택적 파라미터가 명시되었는가
- 반환값 타입이 정확한가 (음수 가능성 포함)
- 예제 출력이 영어 기준인가 (i18n 아닌 경우)
- format 토큰이 전수 나열되었는가
- 실제 사용 가능한 코드인가

상세 format 토큰 목록은 `references/format-tokens.md` 참조.

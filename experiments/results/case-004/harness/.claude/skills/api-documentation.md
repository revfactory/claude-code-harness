# API Documentation Skill

라이브러리 API 문서를 정확하고 완전하게 작성하는 스킬

## Trigger Conditions
- API 문서, README 작성 요청 시

## Instructions

### 함수 문서 템플릿 (반드시 이 형식 준수)

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

### format 토큰 전수 목록 (datekit 전용)
반드시 아래 토큰을 모두 문서화:
| Token | Output | Example |
|-------|--------|---------|
| YYYY | 4자리 연도 | 2026 |
| YY | 2자리 연도 | 26 |
| MM | 2자리 월 (01-12) | 03 |
| M | 월 (1-12) | 3 |
| DD | 2자리 일 (01-31) | 05 |
| D | 일 (1-31) | 5 |
| HH | 24시간 (00-23) | 14 |
| H | 24시간 (0-23) | 14 |
| hh | 12시간 (01-12) | 02 |
| h | 12시간 (1-12) | 2 |
| mm | 분 (00-59) | 30 |
| ss | 초 (00-59) | 45 |
| SSS | 밀리초 (000-999) | 123 |
| A | AM/PM | PM |
| a | am/pm | pm |
| dddd | 요일 (full) | Wednesday |
| ddd | 요일 (short) | Wed |

### 정확성 체크리스트
- [ ] 모든 함수의 선택적 파라미터가 명시되었는가
- [ ] 반환값 타입이 정확한가 (음수 가능성 포함)
- [ ] 예제 출력이 영어 기준인가 (i18n 아닌 경우)
- [ ] format 토큰이 전수 나열되었는가
- [ ] 실제 사용 가능한 코드인가

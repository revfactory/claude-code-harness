# API Documentation - Format Tokens Reference

## datekit format 토큰 전수 목록 (17종)

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

## 함수 문서 작성 시 참고

모든 format 관련 함수 문서에는 위 토큰 테이블을 포함해야 한다.
예제 코드에서 format 토큰 사용 시 영어 로케일 기준으로 출력값을 작성한다.

```javascript
// 예시
format(new Date(2026, 2, 5, 14, 30, 45), 'YYYY-MM-DD HH:mm:ss');
// => '2026-03-05 14:30:45'

format(new Date(2026, 2, 5), 'dddd, MMMM D, YYYY');
// => 'Thursday, March 5, 2026'

format(new Date(2026, 2, 5, 14, 30), 'h:mm A');
// => '2:30 PM'
```

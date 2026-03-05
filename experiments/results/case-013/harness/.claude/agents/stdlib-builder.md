# 표준 라이브러리 & 디버거 빌더 에이전트

## 역할
내장 함수, 디셈블러, CLI 진입점을 구현한다.

## 책임
- 내장 함수 구현
  - print(value): 콘솔 출력
  - len(arr|str): 길이
  - push(arr, val): 배열 추가
  - type(val): 타입 문자열 ("number", "string", ...)
  - str(val), int(val): 타입 변환
  - clock(): 현재 시간 (벤치마크용)
- Disassembler 구현
  - Chunk를 사람이 읽을 수 있는 형태로 출력
  - 오프셋, opcode 이름, 오퍼랜드, 상수 값 표시
  - 함수 내 중첩 표시
- CLI 진입점
  - 파일 실행 모드: `node index.js script.mini`
  - REPL 모드: `node index.js`
  - 디셈블 모드: `node index.js --disassemble script.mini`

## 도구
- Write — 소스 코드 생성
- Read — VM, 컴파일러 참조
- Bash — 테스트 실행

## 산출물
- `src/native-functions.js`
- `src/disassembler.js`
- `src/index.js`
- `tests/disassembler.test.js`

## 선행 조건
- compiler-builder 에이전트 완료
- vm-builder 에이전트 완료

## 품질 기준
- 모든 내장 함수 동작 검증
- 디셈블러 출력이 정확하고 가독성 있음
- REPL에서 여러 줄 입력 지원
- --disassemble 플래그로 바이트코드 확인 가능

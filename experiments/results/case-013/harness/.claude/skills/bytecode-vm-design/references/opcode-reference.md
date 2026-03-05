# Opcode 전체 참조

## 카테고리별 Opcode

### 상수 & 리터럴 (0x00-0x0F)
| Opcode | 값 | 오퍼랜드 | 스택 효과 | 설명 |
|--------|-----|----------|-----------|------|
| OP_CONST | 0x00 | idx(1B) | +1 | constants[idx] push |
| OP_NULL | 0x01 | - | +1 | null push |
| OP_TRUE | 0x02 | - | +1 | true push |
| OP_FALSE | 0x03 | - | +1 | false push |

### 산술 (0x10-0x1F)
| Opcode | 값 | 스택 효과 | 설명 |
|--------|-----|-----------|------|
| OP_ADD | 0x10 | -1 | a + b |
| OP_SUB | 0x11 | -1 | a - b |
| OP_MUL | 0x12 | -1 | a * b |
| OP_DIV | 0x13 | -1 | a / b |
| OP_MOD | 0x14 | -1 | a % b |
| OP_NEG | 0x15 | 0 | -a |

### 비교 (0x20-0x2F)
| Opcode | 값 | 스택 효과 |
|--------|-----|-----------|
| OP_EQ | 0x20 | -1 |
| OP_NEQ | 0x21 | -1 |
| OP_LT | 0x22 | -1 |
| OP_GT | 0x23 | -1 |
| OP_LTE | 0x24 | -1 |
| OP_GTE | 0x25 | -1 |

### 논리 (0x28-0x2F)
| OP_NOT | 0x28 | 0 |
| OP_AND | 0x29 | -1 |
| OP_OR | 0x2A | -1 |

### 변수 (0x30-0x3F)
| Opcode | 오퍼랜드 | 설명 |
|--------|----------|------|
| OP_GET_LOCAL | idx(1B) | stack[frame.offset + idx] push |
| OP_SET_LOCAL | idx(1B) | stack[frame.offset + idx] = top |
| OP_GET_GLOBAL | idx(1B) | globals[constants[idx]] push |
| OP_SET_GLOBAL | idx(1B) | globals[constants[idx]] = pop |
| OP_GET_UPVALUE | idx(1B) | closure.upvalues[idx].value push |
| OP_SET_UPVALUE | idx(1B) | closure.upvalues[idx].value = top |

### 제어 흐름 (0x40-0x4F)
| Opcode | 오퍼랜드 | 설명 |
|--------|----------|------|
| OP_JUMP | offset(2B) | ip += offset |
| OP_JUMP_IF_FALSE | offset(2B) | if !top: ip += offset |
| OP_LOOP | offset(2B) | ip -= offset |

### 함수 (0x50-0x5F)
| Opcode | 오퍼랜드 | 설명 |
|--------|----------|------|
| OP_CLOSURE | idx(1B) + upvals | 클로저 생성 |
| OP_CALL | argc(1B) | 함수 호출 |
| OP_RETURN | - | 함수 반환 |

### 배열 (0x60-0x6F)
| OP_ARRAY | count(1B) | 배열 생성 |
| OP_INDEX | - | arr[idx] |
| OP_INDEX_SET | - | arr[idx] = val |

### 스택/내장 (0x70-0x7F)
| OP_POP | - | 스택 top 제거 |
| OP_DUP | - | 스택 top 복제 |
| OP_PRINT | - | top 출력 |
| OP_LEN | - | 배열/문자열 길이 |
| OP_PUSH | - | 배열에 값 추가 |
| OP_HALT | - | 실행 중단 |

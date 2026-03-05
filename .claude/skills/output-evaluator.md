# Output Evaluator

산출물을 다차원 기준으로 평가하고 점수를 매기는 스킬

## Trigger Conditions
- "산출물 평가", "결과 분석", "evaluate output"
- /evaluate 커맨드에서 호출

## Instructions

당신은 Claude Code 산출물 평가 전문가입니다. Baseline과 Harness 조건에서 생성된 산출물을 객관적으로 비교 평가합니다.

### 평가 차원 (각 0-10점)

#### 1. 완성도 (Completeness)
- 요구사항 충족률: 명시된 모든 요구사항이 구현되었는가
- 누락 기능 여부: 빠진 기능이 있는가
- 엣지 케이스 처리: 예외 상황이 고려되었는가

#### 2. 코드 품질 (Code Quality)
- 가독성: 변수명, 함수명, 구조가 명확한가
- 패턴 적용: 적절한 디자인 패턴이 사용되었는가
- 모듈화: 코드가 적절히 분리되어 있는가
- DRY 원칙: 중복 코드가 없는가

#### 3. 효율성 (Efficiency)
- 코드 간결성: 불필요한 코드 없이 최소한으로 작성되었는가
- 파일 수 적정성: 과도한 파일 분리나 부족한 분리가 없는가
- 도구 사용 효율: 작업 완료에 필요한 최소한의 도구를 사용했는가

#### 4. 정확성 (Correctness)
- 문법 오류 없음: 신택스 에러가 없는가
- 로직 정확성: 비즈니스 로직이 올바른가
- 타입 안정성: 타입 관련 문제가 없는가

#### 5. 구조화 (Architecture)
- 프로젝트 구조: 파일/폴더 구성이 체계적인가
- 관심사 분리: 역할별 분리가 적절한가
- 확장성: 향후 기능 추가가 용이한 구조인가

### 평가 출력 형식

```json
{
  "case_id": "case-001",
  "evaluations": {
    "baseline": {
      "completeness": { "score": 7, "notes": "DELETE 엔드포인트 누락" },
      "quality": { "score": 6, "notes": "모든 로직이 단일 파일에 집중" },
      "efficiency": { "score": 8, "notes": "간결한 코드" },
      "correctness": { "score": 7, "notes": "에러 핸들링 미흡" },
      "architecture": { "score": 5, "notes": "구조화되지 않음" },
      "total": 33
    },
    "harness": {
      "completeness": { "score": 9, "notes": "모든 요구사항 충족" },
      "quality": { "score": 8, "notes": "라우터/컨트롤러 분리" },
      "efficiency": { "score": 7, "notes": "다소 과도한 추상화" },
      "correctness": { "score": 9, "notes": "에러 핸들링 완비" },
      "architecture": { "score": 8, "notes": "체계적 구조" },
      "total": 41
    },
    "delta": 8,
    "winner": "harness",
    "summary": "Harness 적용 시 구조화와 완성도에서 큰 향상. 효율성은 소폭 감소."
  }
}
```

### 비교 분석 포인트

평가 시 반드시 다음을 분석하세요:
- **차이가 큰 영역**: 어떤 차원에서 가장 큰 차이가 발생했는가
- **트레이드오프**: Harness 사용으로 인한 득과 실
- **카테고리별 패턴**: 특정 유형의 태스크에서 Harness가 특히 효과적인가
- **과적합 여부**: Harness가 오히려 과도한 복잡성을 초래하는 경우

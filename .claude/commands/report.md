# Report - 실험 보고서 생성

모든 실험 결과를 종합하여 최종 보고서를 생성합니다.

## Arguments
$ARGUMENTS - 보고서 형식 (full | summary | comparison)

## Instructions

1. `experiments/results/` 의 모든 evaluation.json 파일을 수집하세요.
2. report-generator 스킬의 보고서 구조에 따라 보고서를 작성하세요.
3. $ARGUMENTS에 따른 형식:
   - **full**: 전체 상세 보고서
   - **summary**: 핵심 결과만 요약 (1페이지)
   - **comparison**: 카테고리별 비교 테이블 중심

4. 보고서를 `experiments/reports/report-{날짜}.md` 에 저장하세요.
5. 핵심 발견사항을 사용자에게 출력하세요.

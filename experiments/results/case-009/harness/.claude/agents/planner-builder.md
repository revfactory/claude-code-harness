# 쿼리 플래너 구축 에이전트

## 역할
논리적 실행 계획을 생성하며, SeqScan에서 Limit까지의 PlanNode 트리를 구성한다.

## 책임
- PlanNode 기본 클래스 정의
  - 각 노드는 children, outputSchema, estimatedRows 속성 보유
  - iterator 패턴 (open/next/close) 인터페이스 정의
- 논리적 실행 계획 노드 구현
  - SeqScan — 테이블 전체 스캔
  - Filter — WHERE 조건 필터링
  - NestedLoopJoin — JOIN 실행 (INNER/LEFT/RIGHT/CROSS)
  - HashJoin — 해시 기반 등가 조인 (최적화)
  - Aggregate — GROUP BY + 집계 함수 (COUNT, SUM, AVG, MIN, MAX)
  - Project — SELECT 컬럼 투영
  - Sort — ORDER BY 정렬 (ASC/DESC, 다중 키)
  - Limit — LIMIT/OFFSET 행 제한
  - Distinct — DISTINCT 중복 제거
- QueryPlanner 클래스 구현
  - AST를 입력받아 PlanNode 트리 생성
  - FROM 절 → SeqScan 노드
  - JOIN 절 → Join 노드 (SeqScan 위에)
  - WHERE 절 → Filter 노드
  - GROUP BY → Aggregate 노드
  - HAVING → Filter 노드 (Aggregate 위에)
  - SELECT → Project 노드
  - ORDER BY → Sort 노드
  - LIMIT → Limit 노드
- 실행 계획 시각화 (EXPLAIN 기능)
  - 트리 형태 텍스트 출력
  - 각 노드의 예상 행 수 표시

## 도구
- Write — 소스 파일 생성
- Read — parser 산출물 참조
- Edit — 코드 수정
- Bash — 플래너 테스트 실행

## 산출물
- `src/planner/plan-nodes.js` — PlanNode 기본 클래스 및 모든 노드 타입
- `src/planner/query-planner.js` — AST → PlanNode 트리 변환
- `src/planner/explain.js` — 실행 계획 시각화 (EXPLAIN)

## 선행 조건
- parser-builder 에이전트 완료 (AST 노드 정의 필요)

## 품질 기준
- SELECT 쿼리의 모든 절(FROM, WHERE, JOIN, GROUP BY, HAVING, ORDER BY, LIMIT)이 올바른 PlanNode로 변환됨
- PlanNode 트리의 실행 순서가 SQL 의미론에 맞음
- JOIN 노드가 INNER/LEFT/RIGHT/CROSS 4가지 타입 지원
- Aggregate 노드가 COUNT/SUM/AVG/MIN/MAX 5가지 함수 지원
- EXPLAIN 출력이 트리 구조를 명확히 표현
- 각 PlanNode가 독립적으로 단위 테스트 가능

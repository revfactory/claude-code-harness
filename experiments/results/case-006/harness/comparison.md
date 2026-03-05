# React 상태 관리 라이브러리 비교 분석

> 2026년 3월 기준 | Redux Toolkit, Zustand, Jotai, Recoil, Valtio

---

## 종합 비교 매트릭스

| 항목 | Redux Toolkit | Zustand | Jotai | Recoil (archived) | Valtio |
|------|:---:|:---:|:---:|:---:|:---:|
| 번들 사이즈 (min+gzip) | ~11.2 kB | ~1.1 kB | ~3.6 kB | ~21.5 kB | ~3.8 kB |
| npm 주간 다운로드 | ~7,800,000 | ~4,500,000 | ~1,600,000 | ~500,000 | ~700,000 |
| GitHub Stars | ~10,800 | ~49,000 | ~19,500 | ~19,400 | ~9,200 |
| 첫 릴리스 | 2019 | 2021 | 2020 | 2020 | 2021 |
| 학습 곡선 | B | A | A | C | A |
| TypeScript 지원 | A | A | A | B | A |
| DevTools | A | B | B | B | C |
| SSR 호환성 | A | A | A | D | B |
| 성능 (리렌더링 최적화) | B | A | A | B | B |
| 커뮤니티/생태계 | A | A | B | D | C |

### 등급 기준
- **A**: 최고 수준, 기준 이상
- **B**: 우수, 대부분의 요구 충족
- **C**: 보통, 기본 기능은 갖춤
- **D**: 미흡, 제한적
- **F**: 사용 불가/중단됨

---

## 1. 핵심 개념 및 멘탈 모델

### Redux Toolkit
- **패턴**: Flux 아키텍처 (단방향 데이터 흐름)
- **핵심 개념**: Store, Slice, Reducer, Action, Selector, Middleware
- **멘탈 모델**: 중앙 집중식 상태 저장소. 모든 상태 변경은 action을 dispatch하여 reducer를 통해 수행. 불변성(immer 내장)으로 상태 업데이트.
- **강점**: 예측 가능한 상태 흐름, 풍부한 미들웨어 생태계, RTK Query로 서버 상태 관리 통합
- **약점**: 보일러플레이트가 비교적 많음, 큰 번들 사이즈, 소규모 프로젝트에는 과도

### Zustand
- **패턴**: 단일 스토어 (flux 영감, 단순화)
- **핵심 개념**: Store, Selector, Middleware
- **멘탈 모델**: 훅 기반의 단순한 스토어. React 외부에서도 접근 가능. 필요한 상태만 구독하여 리렌더링 최적화.
- **강점**: 극소 번들 사이즈, 최소 보일러플레이트, React 외부에서도 사용 가능, Provider 불필요
- **약점**: 복잡한 비동기 흐름에는 별도 설계 필요, DevTools 기본 내장 아님(미들웨어 추가)

### Jotai
- **패턴**: 원자적(Atomic) 상태 관리
- **핵심 개념**: Atom, Derived Atom, Write-only Atom, Provider
- **멘탈 모델**: Recoil에서 영감받은 원자 단위 상태. 각 atom이 독립적인 상태 단위. 파생 atom으로 계산된 값 표현. Bottom-up 접근.
- **강점**: 세밀한 리렌더링 제어, React Suspense 네이티브 지원, 최소 API, Provider 선택적
- **약점**: 복잡한 상태 로직 시 atom 조합이 어려울 수 있음

### Recoil (아카이브됨)
- **패턴**: 원자적(Atomic) 상태 관리
- **핵심 개념**: Atom, Selector, RecoilRoot, useRecoilState
- **멘탈 모델**: Facebook(Meta)이 만든 원자 단위 상태 관리. React의 동시성 모드와 통합을 목표로 설계.
- **강점**: React 철학과 밀접한 설계, 비동기 selector 기본 지원
- **약점**: **2025년 1월 아카이브됨 - 더 이상 유지보수되지 않음.** 큰 번들 사이즈, 신규 프로젝트 채택 비추천
- **상태**: Meta의 공식 지원 중단. Jotai로 마이그레이션 권장.

### Valtio
- **패턴**: 프록시 기반 반응형 상태
- **핵심 개념**: proxy, useSnapshot, subscribe
- **멘탈 모델**: JavaScript Proxy를 활용한 반응형 상태. 일반 객체처럼 상태를 직접 변경(mutate)하면 자동으로 컴포넌트가 리렌더링. Vue의 반응성과 유사.
- **강점**: 가장 직관적인 API, mutation 스타일로 상태 변경, React 외부에서도 사용 가능
- **약점**: Proxy 기반이므로 디버깅 시 원본 값 확인이 어려울 수 있음, 커뮤니티 규모 작음

---

## 2. 코드 예제 비교

모든 예제는 다음 기능을 동일하게 구현:
- **카운터**: increment, decrement, reset
- **TODO**: add, toggle, remove, filter(all/active/completed)
- TypeScript 사용, 함수형 컴포넌트

각 라이브러리별 전체 코드는 `examples/` 디렉토리 참조:
- `examples/redux-toolkit/TodoApp.tsx`
- `examples/zustand/TodoApp.tsx`
- `examples/jotai/TodoApp.tsx`
- `examples/recoil/TodoApp.tsx`
- `examples/valtio/TodoApp.tsx`

### 코드량 비교

| 라이브러리 | 스토어/상태 정의 (줄) | 컴포넌트 코드 (줄) | 총 줄 수 |
|---|:---:|:---:|:---:|
| Redux Toolkit | ~55 | ~90 | ~145 |
| Zustand | ~35 | ~85 | ~120 |
| Jotai | ~40 | ~85 | ~125 |
| Recoil | ~45 | ~90 | ~135 |
| Valtio | ~25 | ~85 | ~110 |

---

## 3. 번들 사이즈 (bundlephobia 기준, minified + gzipped)

| 라이브러리 | 패키지 | 사이즈 | 비고 |
|---|---|:---:|---|
| Redux Toolkit | @reduxjs/toolkit + react-redux | ~11.2 kB | immer 포함 |
| Zustand | zustand | ~1.1 kB | 가장 작음 |
| Jotai | jotai | ~3.6 kB | |
| Recoil | recoil | ~21.5 kB | 가장 큼 |
| Valtio | valtio | ~3.8 kB | proxy-compare 포함 |

---

## 4. 학습 곡선 (A-F 등급)

| 라이브러리 | 등급 | 설명 |
|---|:---:|---|
| Redux Toolkit | B | Flux 패턴, slice/reducer 개념 학습 필요. RTK가 보일러플레이트를 줄였지만 기본 Redux 이해 필요 |
| Zustand | A | useState와 유사한 직관성. 10분이면 기본 사용 가능 |
| Jotai | A | atom 개념만 이해하면 즉시 사용 가능. useState 대체 수준의 단순함 |
| Recoil | C | atom/selector 개념 + RecoilRoot 필수 + 비동기 패턴 학습 필요 |
| Valtio | A | 일반 객체 변경과 동일. 가장 낮은 진입 장벽 |

---

## 5. TypeScript 지원도

| 라이브러리 | 등급 | 설명 |
|---|:---:|---|
| Redux Toolkit | A | TypeScript로 작성됨. 뛰어난 타입 추론. createSlice의 자동 액션 타입 생성 |
| Zustand | A | TypeScript로 작성됨. 제네릭 기반 스토어 타입 추론 우수 |
| Jotai | A | TypeScript로 작성됨. atom의 타입이 자동으로 추론됨 |
| Recoil | B | TypeScript 지원은 하지만 일부 타입 정의가 불완전. 아카이브로 개선 불가 |
| Valtio | A | TypeScript로 작성됨. Proxy 타입도 잘 추론됨 |

---

## 6. DevTools

| 라이브러리 | 등급 | 설명 |
|---|:---:|---|
| Redux Toolkit | A | Redux DevTools 완벽 지원. 타임 트래블, 액션 로그, 상태 diff 등 업계 최고 수준 |
| Zustand | B | Redux DevTools 미들웨어로 연동 가능. 기본 내장은 아님 |
| Jotai | B | jotai-devtools 패키지 제공. React DevTools에서 atom 값 확인 가능 |
| Recoil | B | Recoil DevTools 확장(Chrome). 아카이브 후 업데이트 중단 |
| Valtio | C | valtio/utils의 devtools 지원. Redux DevTools 연동 가능하나 설정 필요 |

---

## 7. SSR 호환성

| 라이브러리 | 등급 | 설명 |
|---|:---:|---|
| Redux Toolkit | A | Next.js 공식 지원. next-redux-wrapper 등 성숙한 솔루션 존재 |
| Zustand | A | Provider 불필요로 SSR 자연스러움. Next.js App Router와 호환 |
| Jotai | A | Provider 기반 SSR 지원. Next.js App Router/Server Components 호환 |
| Recoil | D | SSR 지원 실험적. RecoilRoot 초기화 이슈. 아카이브로 개선 불가 |
| Valtio | B | SSR 가능하나 Proxy 초기화 주의 필요. valtio/utils의 proxyWithHistory 활용 |

---

## 8. 성능 (리렌더링 최적화)

| 라이브러리 | 등급 | 최적화 방식 |
|---|:---:|---|
| Redux Toolkit | B | useSelector + shallowEqual로 선택적 구독. createSelector(reselect)로 메모이제이션 |
| Zustand | A | selector 기반 자동 최적화. 구독한 상태만 변경 시 리렌더링. shallow 비교 제공 |
| Jotai | A | atom 단위 구독으로 가장 세밀한 리렌더링 제어. 불필요한 리렌더링 최소화 |
| Recoil | B | atom 단위 구독. 하지만 selector 체인이 깊어지면 성능 저하 가능 |
| Valtio | B | Proxy 기반 자동 추적. 접근한 프로퍼티만 구독. 깊은 객체 중첩 시 오버헤드 가능 |

---

## 9. 커뮤니티 및 생태계

| 라이브러리 | 등급 | GitHub Stars | npm 주간 다운로드 | 유지보수 상태 |
|---|:---:|:---:|:---:|---|
| Redux Toolkit | A | ~10,800 (RTK) / ~60,800 (Redux) | ~7,800,000 | 활발한 유지보수 |
| Zustand | A | ~49,000 | ~4,500,000 | 활발한 유지보수 (pmndrs) |
| Jotai | B | ~19,500 | ~1,600,000 | 활발한 유지보수 (pmndrs) |
| Recoil | D | ~19,400 | ~500,000 (감소 추세) | **2025년 1월 아카이브됨** |
| Valtio | C | ~9,200 | ~700,000 | 활발한 유지보수 (pmndrs) |

---

## 종합 평가

### 최종 순위 (2026년 3월 기준)

1. **Zustand** - 번들 사이즈, 성능, 학습 곡선, 커뮤니티 모든 면에서 균형 잡힌 최고의 선택
2. **Jotai** - 세밀한 상태 관리가 필요한 경우 최적. Zustand과 함께 pmndrs 생태계의 핵심
3. **Redux Toolkit** - 대규모 엔터프라이즈 프로젝트에서 여전히 강력. RTK Query 통합이 장점
4. **Valtio** - 가장 직관적인 API. 프로토타이핑과 소규모 프로젝트에 적합
5. **Recoil** - 아카이브됨. 신규 프로젝트 채택 비추천. 기존 프로젝트는 Jotai로 마이그레이션 권장

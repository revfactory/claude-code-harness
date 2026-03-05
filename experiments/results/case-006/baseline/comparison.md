# React 상태 관리 라이브러리 비교 분석

## 비교 대상

| 라이브러리 | 최초 릴리스 | 현재 버전 (2026 기준) | GitHub Stars |
|-----------|-----------|---------------------|-------------|
| Redux Toolkit (RTK) | 2019 | ~2.x | ~60k+ (Redux 전체) |
| Zustand | 2019 | ~5.x | ~45k+ |
| Jotai | 2020 | ~2.x | ~18k+ |
| Recoil | 2020 | ~0.7.x | ~19k+ |
| Valtio | 2021 | ~2.x | ~9k+ |

---

## 1. 핵심 개념

### Redux Toolkit (RTK)
- **패턴**: Flux 아키텍처 기반의 단방향 데이터 흐름
- **핵심 요소**: Store, Slice (Reducer + Actions), Dispatch, Selector
- **철학**: 예측 가능한 상태 컨테이너. 불변성(Immer 내장), 직렬화 가능한 액션
- **특징**: `createSlice`로 보일러플레이트 대폭 감소, `createAsyncThunk`로 비동기 처리, RTK Query로 서버 상태 관리

### Zustand
- **패턴**: 단일 스토어, 훅 기반
- **핵심 요소**: Store (create 함수), 셀렉터 기반 구독
- **철학**: 최소한의 API, 보일러플레이트 제거, 컴포넌트 트리 외부에서 상태 관리 가능
- **특징**: Provider 불필요, 미들웨어 시스템 (persist, devtools, immer), vanilla JS에서도 사용 가능

### Jotai
- **패턴**: 원자적(Atomic) 상태 모델 (Bottom-up)
- **핵심 요소**: Atom (원시 atom, 파생 atom, 비동기 atom)
- **철학**: React의 `useState`를 글로벌로 확장한 느낌. 최소 단위 상태 관리
- **특징**: Provider 선택적, atom 조합으로 복잡한 상태 구성, Suspense 네이티브 지원

### Recoil
- **패턴**: 원자적(Atomic) 상태 모델 (Facebook 개발)
- **핵심 요소**: Atom, Selector (파생 상태), RecoilRoot
- **철학**: React 내부 스케줄러와의 통합, Concurrent Mode 호환 목표
- **특징**: `RecoilRoot` 필수, atomFamily/selectorFamily로 동적 상태, Suspense 지원
- **주의**: 2025년 기준 Meta의 유지보수가 사실상 중단된 상태. 신규 프로젝트에서는 비권장

### Valtio
- **패턴**: Proxy 기반 뮤터블 스타일
- **핵심 요소**: proxy (뮤터블 상태), useSnapshot (읽기 전용 스냅샷)
- **철학**: JavaScript의 자연스러운 뮤터블 코드 스타일을 유지하면서 React 리렌더링 최적화
- **특징**: `proxy()`로 상태 생성, `useSnapshot()`으로 컴포넌트 구독, 자동 추적 기반 리렌더링

---

## 2. 코드 예제

### 카운터 예제 비교

각 라이브러리의 카운터 구현은 `examples/` 디렉토리에서 확인 가능. 아래는 핵심 패턴 요약:

| 라이브러리 | 상태 정의 | 상태 읽기 | 상태 변경 |
|-----------|---------|---------|---------|
| RTK | `createSlice({ initialState })` | `useSelector(s => s.counter)` | `dispatch(increment())` |
| Zustand | `create((set) => ({ count: 0 }))` | `useStore(s => s.count)` | `useStore(s => s.increment)()` |
| Jotai | `atom(0)` | `useAtom(countAtom)` | `setCount(c => c + 1)` |
| Recoil | `atom({ key, default: 0 })` | `useRecoilState(countState)` | `setCount(c => c + 1)` |
| Valtio | `proxy({ count: 0 })` | `useSnapshot(state).count` | `state.count++` |

### TODO 앱 예제

각 라이브러리별 완전한 TODO 앱 구현은 `examples/` 하위 디렉토리 참조:
- `examples/redux-toolkit/TodoApp.tsx`
- `examples/zustand/TodoApp.tsx`
- `examples/jotai/TodoApp.tsx`
- `examples/recoil/TodoApp.tsx`
- `examples/valtio/TodoApp.tsx`

---

## 3. 번들 사이즈

| 라이브러리 | 번들 사이즈 (minified + gzip) | 의존성 |
|-----------|---------------------------|-------|
| Redux Toolkit | ~11-13 KB (redux + RTK + react-redux) | redux, immer, reselect, redux-thunk |
| Zustand | ~1.2 KB | 없음 (peer: react) |
| Jotai | ~3.5 KB (core) | 없음 (peer: react) |
| Recoil | ~22 KB | 없음 (peer: react) |
| Valtio | ~3 KB | proxy-compare |

**분석**: Zustand이 가장 가볍고, Recoil이 가장 무겁다. RTK는 Immer 등 내장 의존성으로 인해 중간 수준이지만, RTK Query를 포함하면 더 커진다. 번들 사이즈가 중요한 프로젝트(모바일 웹 등)라면 Zustand이나 Jotai가 유리하다.

---

## 4. 학습 곡선

| 라이브러리 | 난이도 | 설명 |
|-----------|-------|------|
| Redux Toolkit | ★★★☆☆ (중간) | Flux 패턴, 불변성, 미들웨어 개념 필요. RTK가 보일러플레이트를 줄였지만 여전히 개념이 많음 |
| Zustand | ★☆☆☆☆ (매우 쉬움) | API가 극도로 단순. `create` 하나로 시작 가능. 5분이면 기본 사용법 습득 |
| Jotai | ★★☆☆☆ (쉬움) | atom 개념만 이해하면 바로 사용 가능. `useState` 경험이 있으면 자연스러움 |
| Recoil | ★★★☆☆ (중간) | atom/selector 개념, key 관리, RecoilRoot 설정 필요. 공식 문서 부족 |
| Valtio | ★☆☆☆☆ (매우 쉬움) | JavaScript 객체를 그대로 사용. proxy/snapshot 두 개념만 이해하면 됨 |

---

## 5. TypeScript 지원

| 라이브러리 | TS 지원 수준 | 특징 |
|-----------|------------|------|
| Redux Toolkit | 우수 | TypeScript로 작성됨. 강력한 타입 추론. `PayloadAction<T>` 등 유틸 타입 제공 |
| Zustand | 우수 | TypeScript로 작성됨. 제네릭 기반 스토어 타입 추론. `StateCreator` 타입 |
| Jotai | 우수 | TypeScript로 작성됨. atom의 타입이 자동 추론됨. 타입 유틸리티 제공 |
| Recoil | 보통 | TypeScript 지원하나, 일부 타입이 `any`로 빠지는 경우 존재. Flow 기반 출발 |
| Valtio | 우수 | TypeScript로 작성됨. Proxy 타입 추론이 자연스러움 |

---

## 6. DevTools

| 라이브러리 | DevTools 지원 | 도구 |
|-----------|-------------|------|
| Redux Toolkit | 최고 수준 | Redux DevTools Extension (시간 여행 디버깅, 액션 히스토리, 상태 diff, 액션 리플레이) |
| Zustand | 좋음 | Redux DevTools와 연동 가능 (`devtools` 미들웨어). 시간 여행 디버깅 지원 |
| Jotai | 보통 | `jotai-devtools` 패키지 별도 설치. atom 값 실시간 확인 가능. Redux DevTools 연동도 가능 |
| Recoil | 보통 | 공식 DevTools 미완성. `recoil-devtools` 커뮤니티 패키지 존재 |
| Valtio | 보통 | Redux DevTools 연동 가능 (`devtools` 유틸). 기본적인 상태 추적 |

---

## 7. SSR (Server-Side Rendering)

| 라이브러리 | SSR 지원 | Next.js 통합 |
|-----------|---------|-------------|
| Redux Toolkit | 우수 | `next-redux-wrapper` 또는 직접 구현. 풍부한 가이드와 레퍼런스 |
| Zustand | 좋음 | Context 없이 동작하므로 SSR 친화적. 단, 서버/클라이언트 상태 동기화 직접 관리 필요 |
| Jotai | 우수 | Provider의 `initialValues`로 서버 상태 주입. Next.js App Router와 자연스러운 통합 |
| Recoil | 제한적 | `RecoilRoot`의 `initializeState`로 가능하나, 공식 SSR 가이드 부족 |
| Valtio | 좋음 | `useSnapshot`이 서버에서도 동작. 하이드레이션 처리 직접 구현 필요 |

---

## 8. 성능

| 라이브러리 | 리렌더링 최적화 | 메모이제이션 | 대규모 상태 |
|-----------|-------------|-----------|-----------|
| Redux Toolkit | 셀렉터 기반 구독. `createSelector`로 메모이제이션. 상태 구조 설계에 따라 성능 좌우 | reselect 내장 | 정규화(normalization) 패턴으로 대규모 상태 효율적 관리. `createEntityAdapter` 제공 |
| Zustand | 셀렉터 기반 구독. 구독한 상태만 변경 시 리렌더링. shallow 비교 유틸 제공 | 수동 | 단일 스토어지만 슬라이스 패턴으로 분리 가능 |
| Jotai | atom 단위 구독. 관련 atom만 리렌더링. 가장 세밀한 구독 단위 | atom 파생으로 자동 | atom 단위로 자연스럽게 분산. 대규모에서도 효율적 |
| Recoil | atom 단위 구독. 관련 컴포넌트만 리렌더링 | selector 캐싱 | atom 단위 분산. 그러나 내부 구현의 메모리 사용량이 다소 높음 |
| Valtio | Proxy 기반 자동 추적. 실제 사용된 속성만 추적하여 리렌더링 | 자동 추적 | Proxy 기반이라 깊은 객체에서도 효율적. 단, 매우 큰 배열에서는 주의 필요 |

---

## 9. 커뮤니티 및 생태계

| 라이브러리 | npm 주간 다운로드 | 생태계 | 유지보수 상태 |
|-----------|----------------|-------|-------------|
| Redux Toolkit | ~8M+ | 가장 방대함. 미들웨어, 유틸, 교육 자료 풍부. RTK Query 포함 | 활발. Mark Erikson 주도의 꾸준한 업데이트 |
| Zustand | ~5M+ | 빠르게 성장. pmndrs 생태계(drei, react-three-fiber 등)와 연계 | 매우 활발. Daishi Kato 주도 |
| Jotai | ~1.5M+ | 성장 중. jotai-devtools, jotai-urql 등 확장 패키지 | 활발. Daishi Kato 주도 |
| Recoil | ~300K (감소 추세) | 정체. Meta 내부에서도 사용 축소 추정 | 사실상 유지보수 중단. 2024년 이후 주요 업데이트 없음 |
| Valtio | ~800K+ | 성장 중. valtio-yjs 등 확장 존재 | 활발. Daishi Kato 주도 |

---

## 종합 비교 매트릭스

| 항목 | RTK | Zustand | Jotai | Recoil | Valtio |
|------|-----|---------|-------|--------|--------|
| 번들 사이즈 | C | A+ | A | D | A |
| 학습 곡선 | C | A+ | A | C | A+ |
| TypeScript | A | A | A | B | A |
| DevTools | A+ | A | B | C | B |
| SSR | A | B+ | A | C | B+ |
| 성능 | A | A | A+ | A | A |
| 커뮤니티 | A+ | A | B+ | D | B |
| 보일러플레이트 | C | A | A+ | B | A+ |
| 비동기 처리 | A (RTK Query) | B | A (Suspense) | A (Suspense) | B |
| **종합** | **A** | **A+** | **A** | **C** | **A** |

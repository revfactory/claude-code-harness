# React 상태 관리 라이브러리 - 프로젝트별 추천 가이드

## 빠른 의사결정 플로우차트

```
프로젝트 시작
  |
  +-- 프로토타입 / 소규모 프로젝트?
  |     +-- YES --> Zustand 또는 Valtio
  |     +-- NO (아래 계속)
  |
  +-- 대규모 엔터프라이즈?
  |     +-- YES --> Redux Toolkit
  |     +-- NO (아래 계속)
  |
  +-- 세밀한 상태 구독이 핵심?
  |     +-- YES --> Jotai
  |     +-- NO (아래 계속)
  |
  +-- 기본 추천 --> Zustand
```

---

## 프로젝트 규모별 추천

### 소규모 프로젝트 (1-3명, 5-15 페이지)
**1순위: Zustand** | **2순위: Valtio**

- 이유:
  - 보일러플레이트가 거의 없어 빠른 개발 가능
  - Provider 설정 없이 즉시 사용
  - 번들 사이즈가 작아 성능 부담 없음
  - 학습 비용이 거의 없음

```
적합한 프로젝트 예시:
- 개인 블로그, 포트폴리오
- 사내 관리 도구
- MVP / 프로토타입
- 랜딩 페이지 + 간단한 인터랙션
```

### 중규모 프로젝트 (3-10명, 15-50 페이지)
**1순위: Zustand** | **2순위: Jotai** | **3순위: Redux Toolkit**

- Zustand: 팀원 온보딩이 빠르고, 코드 구조가 직관적
- Jotai: 상태 간 의존성이 복잡한 경우 atom 조합이 강력
- RTK: 팀에 Redux 경험자가 많은 경우 자연스러운 선택

```
적합한 프로젝트 예시:
- SaaS 대시보드
- E-commerce 플랫폼
- 소셜 미디어 앱
- B2B 관리 시스템
```

### 대규모 프로젝트 (10명+, 50 페이지+)
**1순위: Redux Toolkit** | **2순위: Zustand + 구조 규약**

- RTK 추천 이유:
  - 엄격한 패턴으로 대규모 팀의 코드 일관성 보장
  - RTK Query로 서버 상태까지 통합 관리
  - Redux DevTools의 시간 여행 디버깅이 복잡한 버그 추적에 필수적
  - 방대한 교육 자료와 커뮤니티 지원
  - 채용 시장에서 Redux 경험자를 찾기 쉬움

```
적합한 프로젝트 예시:
- 대규모 엔터프라이즈 앱 (ERP, CRM)
- 금융 서비스 대시보드
- 실시간 협업 도구
- 복잡한 폼 워크플로우가 있는 시스템
```

---

## 프로젝트 유형별 추천

### 1. 폼이 많은 애플리케이션
**추천: Zustand 또는 Valtio**

- Valtio: 뮤터블 스타일이 폼 상태 관리에 자연스러움. 중첩 객체 다루기 편함
- Zustand: immer 미들웨어와 함께 사용하면 폼 상태 관리 깔끔

### 2. 실시간 데이터 (채팅, 주식, IoT)
**추천: Zustand 또는 Redux Toolkit**

- Zustand: 컴포넌트 외부에서 상태 업데이트 가능 (WebSocket 핸들러에서 직접 호출)
- RTK: `createListenerMiddleware`로 사이드 이펙트 관리

### 3. 데이터 시각화 / 대시보드
**추천: Jotai**

- 각 차트/위젯이 독립 atom으로 관리되어 불필요한 리렌더링 최소화
- atom 파생으로 데이터 변환 파이프라인 구성이 직관적

### 4. Next.js / SSR 기반 프로젝트
**추천: Jotai > Zustand > RTK**

- Jotai: Provider의 `initialValues`로 서버 상태 주입이 가장 자연스러움
- Zustand: Provider 없이 동작하므로 SSR 환경에서 간단
- RTK: `next-redux-wrapper`로 가능하나 설정이 복잡

### 5. React Native 모바일 앱
**추천: Zustand > Jotai**

- Zustand: 번들 사이즈 최소, persist 미들웨어로 AsyncStorage 연동 간편
- Jotai: atomWithStorage로 영속 상태 관리 가능

### 6. 마이크로 프론트엔드
**추천: Zustand 또는 Valtio**

- 둘 다 Provider 없이 동작하므로 독립적인 모듈 간 상태 공유 용이
- vanilla JS 모드 지원으로 프레임워크 독립적 사용 가능

### 7. 서버 상태 중심 (API 데이터 위주)
**추천: RTK Query (Redux Toolkit) 또는 상태 관리 라이브러리 + TanStack Query 조합**

- RTK Query: 캐싱, 자동 리패칭, 폴링, 낙관적 업데이트를 하나의 패키지로
- TanStack Query + Zustand/Jotai: 서버 상태는 TanStack Query, 클라이언트 상태만 경량 라이브러리로

---

## 마이그레이션 가이드 요약

### Redux -> Zustand
- 가장 자연스러운 마이그레이션 경로
- 스토어 패턴이 유사하므로 개념적 전환 비용 낮음
- 점진적 마이그레이션 가능 (컴포넌트 단위로 교체)

### Redux -> Jotai
- 상태를 atom 단위로 분해하는 리팩터링 필요
- selector -> 파생 atom 전환은 비교적 직관적
- 대규모 코드베이스에서는 시간이 많이 소요될 수 있음

### Recoil -> Jotai
- 가장 쉬운 마이그레이션. 개념이 거의 동일
- `atom({ key, default })` -> `atom(default)` (key 제거)
- `selector` -> 파생 `atom`
- `RecoilRoot` -> Provider (선택적)
- Recoil이 유지보수 중단 상태이므로 마이그레이션 강력 권장

---

## 비추천 시나리오

| 라이브러리 | 비추천 상황 |
|-----------|-----------|
| Redux Toolkit | 소규모 프로젝트 (과도한 구조), 번들 사이즈가 극도로 중요한 경우 |
| Zustand | 매우 복잡한 상태 의존성 그래프가 있는 경우 (Jotai가 더 적합) |
| Jotai | 팀 전체가 Redux에 익숙하고 변경 의지가 없는 경우 |
| Recoil | 모든 신규 프로젝트 (유지보수 중단) |
| Valtio | Proxy를 이해하지 못하는 팀, IE 지원 필요 시 (사실상 해당 없음) |

---

## 최종 결론

2026년 기준, **Zustand**이 가장 범용적인 선택지다. 학습 곡선이 낮고, 번들 사이즈가 작으며, 대부분의 프로젝트 규모와 유형에 적합하다. 세밀한 상태 관리가 필요하면 **Jotai**, 대규모 엔터프라이즈 환경이면 **Redux Toolkit**을 선택하라. **Recoil**은 신규 프로젝트에서 사용하지 말 것. **Valtio**는 뮤터블 스타일을 선호하는 팀에게 훌륭한 대안이다.

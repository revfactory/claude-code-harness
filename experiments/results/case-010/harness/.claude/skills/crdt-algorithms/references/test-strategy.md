# CRDT 테스트 전략

## 6가지 테스트 전략

### 1. 단일 사이트 기본 연산
- 삽입: 빈 문서에 문자 삽입, 여러 위치에 삽입
- 삭제: 특정 위치 삭제, 범위 경계 삭제
- getText: 삽입/삭제 후 올바른 텍스트 반환 확인

### 2. 2사이트 비충돌 동기화
- 사이트 A가 앞부분 편집, 사이트 B가 뒷부분 편집
- 동기화 후 양쪽 동일 결과 확인

### 3. 시나리오 A: 동시 삽입 같은 위치
- 두 사이트가 같은 위치에 다른 문자 삽입
- 동기화 후 결정론적 순서 (siteId 기반) 확인
- 양방향 동기화 순서와 무관하게 동일 결과

### 4. 시나리오 B: 삽입 vs 삭제 같은 위치
- 사이트 A가 위치 N에 삽입, 사이트 B가 위치 N을 삭제
- tombstone 기반이므로 삽입된 문자가 살아남아야 함

### 5. 시나리오 C: 3사이트 복합 편집
- 3개 사이트가 독립적으로 여러 연산 수행
- 모든 쌍 간 동기화 후 3사이트 모두 수렴 확인

### 6. 랜덤 퍼즈 테스트

```javascript
// 퍼즈 테스트 패턴
for (let i = 0; i < N; i++) {
  const site = randomSite();
  const op = Math.random() > 0.3 ? 'insert' : 'delete';
  if (op === 'insert') {
    const pos = randomInt(0, site.getText().length);
    site.insert(pos, randomChar());
  } else {
    if (site.getText().length > 0) {
      const pos = randomInt(0, site.getText().length - 1);
      site.delete(pos);
    }
  }
}
// syncAll 후 모든 사이트의 getText() 동일 확인
syncAll(sites);
assert(allEqual(sites.map(s => s.getText())));
```

- N회 랜덤 연산 후 전체 동기화
- 모든 사이트가 동일한 텍스트로 수렴하는지 검증
- 다양한 시드로 반복 실행하여 견고성 확인

# 의존성 그래프 구현 가이드

## 자료 구조
```javascript
class DependencyGraph {
  // 셀 A가 셀 B를 참조 → dependencies: A → [B], dependents: B → [A]
  dependencies = new Map();  // cellRef → Set<cellRef> (이 셀이 참조하는 셀들)
  dependents = new Map();    // cellRef → Set<cellRef> (이 셀을 참조하는 셀들)
}
```

## 순환 감지 (DFS)
```javascript
detectCycle(startRef) {
  const visited = new Set();
  const recursionStack = new Set();
  
  const dfs = (ref) => {
    visited.add(ref);
    recursionStack.add(ref);
    
    for (const dep of this.dependencies.get(ref) || []) {
      if (!visited.has(dep)) {
        if (dfs(dep)) return true;
      } else if (recursionStack.has(dep)) {
        return true; // 순환!
      }
    }
    
    recursionStack.delete(ref);
    return false;
  };
  
  return dfs(startRef);
}
```

## 위상 정렬 (Kahn's Algorithm)
```javascript
getEvaluationOrder(changedCells) {
  // 1. 영향받는 셀 수집 (BFS)
  const affected = new Set();
  const queue = [...changedCells];
  while (queue.length) {
    const ref = queue.shift();
    for (const dep of this.dependents.get(ref) || []) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    }
  }
  
  // 2. affected 내에서 위상 정렬
  // in-degree 계산 → 큐 기반 정렬
  // 결과: 안전한 평가 순서
}
```

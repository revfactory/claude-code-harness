# Aggregate 구현 패턴

## AggregateRoot 기반 클래스
```javascript
class AggregateRoot {
  #uncommittedEvents = [];
  #version = 0;

  constructor(id) {
    this.id = id;
  }

  get version() { return this.#version; }

  loadFromHistory(events) {
    for (const event of events) {
      this.#applyEvent(event, false);
      this.#version = event.version;
    }
  }

  apply(event) {
    event.version = this.#version + 1;
    event.timestamp = Date.now();
    this.#applyEvent(event, true);
    this.#version = event.version;
  }

  #applyEvent(event, isNew) {
    const handler = `on${event.constructor.name}`;
    if (this[handler]) this[handler](event);
    if (isNew) this.#uncommittedEvents.push(event);
  }

  getUncommittedEvents() {
    const events = [...this.#uncommittedEvents];
    this.#uncommittedEvents = [];
    return events;
  }
}
```

## Repository 패턴
```javascript
class Repository {
  constructor(AggregateClass, eventStore, snapshotStore) {
    this.AggregateClass = AggregateClass;
    this.eventStore = eventStore;
    this.snapshotStore = snapshotStore;
  }

  async load(id) {
    const aggregate = new this.AggregateClass(id);
    
    // 스냅샷에서 시작
    const snapshot = this.snapshotStore?.get(id);
    if (snapshot) {
      aggregate.restoreFromSnapshot(snapshot.state);
      aggregate.version = snapshot.version;
    }
    
    // 이후 이벤트 재생
    const fromVersion = snapshot ? snapshot.version + 1 : 0;
    const events = this.eventStore.getStreamFrom(id, fromVersion);
    aggregate.loadFromHistory(events);
    
    return aggregate;
  }

  async save(aggregate) {
    const events = aggregate.getUncommittedEvents();
    if (events.length === 0) return;
    
    this.eventStore.append(
      aggregate.id, 
      events, 
      aggregate.version - events.length // expectedVersion
    );
    
    // 스냅샷 조건 체크
    if (aggregate.version % 100 === 0 && this.snapshotStore) {
      this.snapshotStore.save(aggregate.id, aggregate.version, aggregate.snapshot());
    }
  }
}
```

# RFC 0001: Fine-Grained Reactive Signals & Scheduler

- **RFC**: 0001
- **Author**: Florynx Labs Core Team
- **Status**: Accepted
- **Created**: 2026-07-22

## Summary
Defines the core reactive primitive architecture (`signal`, `effect`, `computed`, `batch`) and the scheduling layer (`PriorityQueue`, `requestIdleCallback` integration) powering VELYX without Virtual DOM overhead.

## Architecture

```text
Signal Read / Write
     ↓
Subscriber Tracking / Push Notification
     ↓
Scheduler Priority Queue (Immediate | UserBlocking | Normal | Low | Idle)
     ↓
Batch DOM Mutations
```

## Specification
1. **Signal Primitive**: Reactive value container with automatic subscriber registration during execution.
2. **Scheduler Priority Levels**:
   - `Immediate`: Synchronous execution (1ms budget).
   - `UserBlocking`: Interactive UI updates (user click/input).
   - `Normal`: Default state updates.
   - `Low`: Background data processing.
   - `Idle`: Non-critical work scheduled during browser idle periods.
3. **Glitch-Free Guarantee**: Derived computed values are topologically sorted to eliminate intermediate invalid computations.

# VELYX Core Concepts & Fine-Grained Reactivity

This guide covers the fundamental reactive primitives of **VELYX**: `signal`, `effect`, `computed`, and `batch`.

---

## 1. Signals

Signals are fine-grained reactive state containers.

```ts
import { signal } from '@velyx/core';

// Declare a signal
const count = signal(0);

// Read value
console.log(count()); // 0
console.log(count.value); // 0

// Peek value without tracking
console.log(count.peek()); // 0

// Write value
count(1);
count.value = 2;
```

---

## 2. Effects

Effects automatically track signal reads and re-execute whenever dependent signals change.

```ts
import { signal, effect } from '@velyx/core';

const count = signal(0);

const stop = effect(() => {
  console.log(`Current count: ${count()}`);
});

count(1); // Logs "Current count: 1"

// Dispose effect
stop();
```

---

## 3. Computed Signals

Derived signals whose values are recomputed lazily when dependencies update.

```ts
import { signal, computed } from '@velyx/core';

const price = signal(100);
const quantity = signal(2);

const total = computed(() => price() * quantity());
console.log(total()); // 200
```

---

## 4. Batching

Defers subscriber notifications until all batch updates complete, running affected effects exactly once.

```ts
import { signal, batch } from '@velyx/core';

const a = signal(0);
const b = signal(0);

batch(() => {
  a(1);
  b(2);
}); // Single effect flush
```

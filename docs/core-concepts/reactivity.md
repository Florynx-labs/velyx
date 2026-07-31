# Reactivity

VELYX uses **fine-grained signals** for reactivity. Unlike Virtual DOM frameworks, only the exact DOM nodes that depend on a changed signal are updated — no diffing, no re-rendering of entire component trees.

## Signals (`state`)

Declare reactive state with the `state` keyword:

```vx
<setup>
  state count = 0;
  state name  = "Alice";
  state items = ["a", "b", "c"];
</setup>
```

The compiler transforms each `state` declaration into a signal:

```js
// Compiled output
const count = signal(0);
const name  = signal("Alice");
```

### Updating state

```vx
<setup>
  state count = 0;

  function increment() {
    count++;      // compiled → count(count() + 1)
  }

  function reset() {
    count = 0;    // compiled → count(0)
  }
</setup>
```

## Computed values

`computed` creates a derived signal that re-evaluates only when its dependencies change:

```vx
<setup>
  state count  = 0;
  computed double = () => count * 2;
  computed isEven = () => count % 2 === 0;
</setup>

<template>
  <p>Count: {{ count }}</p>
  <p>Double: {{ double }}</p>
  <p>{{ isEven ? "Even" : "Odd" }}</p>
</template>
```

## Watchers

React to state changes with side effects:

```vx
<setup>
  state query = "";

  watch(query, (newVal, oldVal) => {
    console.log(`Query changed from "${oldVal}" to "${newVal}"`);
    fetchResults(newVal);
  });
</setup>
```

## Effects

Run reactive side effects that track their own dependencies automatically:

```vx
<setup>
  state title = "VELYX";

  effect(() => {
    document.title = title; // Re-runs whenever `title` changes
  });
</setup>
```

## Batching updates

Group multiple state mutations into a single DOM update:

```vx
<setup>
  state x = 0;
  state y = 0;

  function moveOrigin() {
    batch(() => {
      x = 10;   // DOM not updated yet
      y = 20;   // DOM not updated yet
    });         // → single DOM update here
  }
</setup>
```

## Lifecycle hooks

```vx
<setup>
  onMount(() => {
    console.log("Component is in the DOM");
  });

  onDestroy(() => {
    console.log("Component is removed from the DOM");
  });
</setup>
```

## Reactivity without Virtual DOM

VELYX's signals connect directly to DOM nodes. When a signal changes:

1. Only the DOM node(s) that read that signal are updated.
2. No component tree is re-rendered.
3. No diffing algorithm runs.

This results in **O(1) update cost per change**, regardless of component tree size.

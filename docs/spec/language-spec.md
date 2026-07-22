# 📜 VELYX SFC Formal Language Specification (v0.2.0)

**Florynx Labs Core Team Standard**

## 1. Overview
A VELYX Single File Component (`.vx`) is a declarative Web component format containing up to three root elements: `<template>`, `<script>`, and `<style>`.

```html
<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <button vx-click="handleClick">Click Me</button>
  </div>
</template>

<script>
state title = "Hello Velyx"

function handleClick() {
  title = "Updated Velyx State"
}
</script>

<style>
.container {
  padding: 1rem;
}
</style>
```

---

## 2. Template Grammar & Directives

### 2.1 Interpolations
- **Syntax**: `{{ expression }}`
- **Semantics**: Evaluates the reactive expression and binds the output directly to a DOM Text Node via fine-grained signal tracking.

### 2.2 Directives
| Directive | Syntax | Semantics |
| :--- | :--- | :--- |
| **Event Binding** | `vx-click="handler"` / `vx-on:event="handler"` | Attaches native DOM event listener |
| **Two-way Model** | `vx-model="signalName"` | Bidirectional input binding |
| **Conditional** | `vx-if="condition"` | Fine-grained structural DOM mounting |
| **Looping** | `vx-for="item in items"` | Keyed list DOM reconciliation |

---

## 3. Script Transformation Rules

- `state varName = initialValue` → `const varName = signal(initialValue)`
- Variable read `varName` → `varName()`
- Variable assignment `varName = val` → `varName(val)`
- Increment `varName++` → `varName(varName() + 1)`

---

## 4. Parser Diagnostics & Error Recovery
The compiler exposes language server APIs for diagnostic recovery:
- `MISSING_CLOSING_TAG`
- `UNTERMINATED_INTERPOLATION`
- `INVALID_DIRECTIVE_SYNTAX`

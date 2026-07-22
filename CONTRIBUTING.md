# Contributing to VELYX

Thank you for your interest in contributing to **VELYX**, the compiler-first reactive frontend platform built by **Florynx Labs**!

We welcome contributions of all kinds: bug fixes, performance optimizations, documentation improvements, RFC proposals, and developer tooling.

---

## 1. Code of Conduct

By participating in this project, you agree to abide by our community standards:
* Be respectful, inclusive, and constructive in all communications.
* Focus on technical merit, clarity, and measurable benchmark data.
* Never sacrifice code readability for unmeasured micro-optimizations.

---

## 2. Monorepo Architecture Overview

VELYX is organized as a pnpm workspace monorepo:

```
velyx/
├── packages/
│   ├── core/           # Public export facade (@velyx/core)
│   ├── runtime-core/    # Signals, Priority Scheduler, Graph, Lifecycle
│   ├── runtime-dom/     # DOM driver, Keyed list reconciliation, Events
│   ├── runtime/         # Unified runtime facade
│   ├── compiler/        # SFC Lexer, AST, IR, Optimization Passes, CodeGen
│   ├── server/          # SSR Engine, Hydration Markers, Server Actions
│   ├── router/          # Dynamic SPA/SSR router
│   ├── devtools/        # Inspection hook & window bindings
│   └── cli/             # Project scaffolding & CLI runner
├── adapters/
│   └── adapter-vite/    # Vite plugin for .vx Single-File Components
├── benchmarks/          # Performance benchmarks & regression tests
├── docs/                # Architecture docs, RFCs, and stabilization reports
```

---

## 3. Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **pnpm**: v8.0.0 or higher

### Step-by-Step

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Florynx-labs/velyx.git
   cd velyx
   ```

2. **Install workspace dependencies:**
   ```bash
   pnpm install
   ```

3. **Build all packages:**
   ```bash
   pnpm build
   ```

4. **Run the unit test suite:**
   ```bash
   pnpm test
   ```

5. **Run the example counter app locally:**
   ```bash
   pnpm dev
   ```

---

## 4. Architectural Rules & Design Principles

All code submitted to VELYX must adhere to the following core rules:

1. **Compiler-First & Zero-VDOM:** Never introduce a Virtual DOM. All reactivity must be established statically by the compiler or via fine-grained signal subscriptions.
2. **Ultra-Strict TypeScript:** All packages must compile cleanly under `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, and `verbatimModuleSyntax: true`.
3. **No Unmeasured Optimizations:** Any performance optimization pull request must include baseline and post-patch benchmark numbers using `pnpm bench`.
4. **RFC Requirement:** Any breaking API change, compiler IR change, or new top-level package must start with an **RFC (Request for Comments)** in `docs/rfcs/`.

---

## 5. Submitting a Pull Request (PR)

1. Create a descriptive branch name: `git checkout -b feat/compiler-const-folding` or `fix/signal-memory-leak`.
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   * `feat(compiler): add constant folding pass for static templates`
   * `fix(runtime-core): prevent subscriber leaks during scope destruction`
   * `docs(architecture): update IR pipeline diagram`
3. Verify that `pnpm build` and `pnpm test` both pass cleanly with zero warnings.
4. Submit your PR against the `main` branch with a thorough explanation of what was changed and why.

---

*Thank you for helping build the future of compiler-first frontend engineering with VELYX!*

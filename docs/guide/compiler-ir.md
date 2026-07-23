# VELYX Compiler Architecture & IR Pipeline

The `@velyx/compiler` pipeline transforms `.vx` Single-File Components through five distinct stages:

```
Source (.vx) → Lexer → Template AST → Intermediate Representation (IRRoot) → Optimization Passes → CodeGen
```

---

## Intermediate Representation (IR) Nodes

The compiler emits a strongly-typed `IRRootNode`:

```ts
export interface IRRootNode {
  readonly type: 'IRRoot';
  readonly script: string;
  readonly style: string;
  readonly stateVars: ReadonlySet<string>;
  readonly children: readonly IRNode[];
}
```

### Static Optimization Passes

1. **Static Subtree Detection:** Flags static template nodes containing zero reactive references for hoisting.
2. **Constant Folding:** Collapses static literal expressions.
3. **Hydration Marker Analysis:** Computes selective hydration island metadata for SSR execution.

# Compiler Architecture

The VELYX compiler transforms `.vx` Single-File Components into optimized ES modules in a multi-stage pipeline.

## Pipeline Overview

```
.vx source
    │
    ▼
┌─────────────────────┐
│  SFC Parser         │   parseSFC()
│  Splits blocks:     │
│  template, setup,   │
│  config, style,     │
│  transition,        │
│  script server      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  HTML Parser        │   parseHtmlNodes()
│  Template → AST     │
│  (TemplateNode[])   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  IR Transformer     │   astToIR()
│  AST → IR tree      │
│  State extraction   │
│  setup/script merge │
│  Transition IR      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Optimization       │   runOptimizationPasses()
│  Passes             │
│  - Static hoisting  │
│  - Dead transition  │
│    elimination      │
│  - Constant folding │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Code Generator     │   generateCodeFromIR()
│  IRRoot → ES module │
│  Signal transform   │
│  WAAPI registration │
└────────┬────────────┘
         │
         ▼
   ES Module output
```

## SFC Block Priority

The compiler applies the following priority for client logic:

1. **`<setup>`** — v0.5+ preferred block
2. **`<script>`** — backward-compatible fallback (deprecated)

If both are present, `<setup>` wins and a diagnostic warning is emitted.

## Intermediate Representation (IR)

The IR is a typed tree of nodes:

```ts
type IRNode = IRRootNode | IRElementNode | IRTextNode;

interface IRRootNode {
  script: string;          // compiled client script
  style:  string;          // raw CSS
  stateVars: Set<string>;  // reactive state variable names
  transitions: TransitionDefinition[];
  children: IRNode[];
}
```

## Compiler Plugins

Extend the compiler at any stage:

```ts
import { definePlugin } from '@velyx/compiler';

export default definePlugin({
  name: 'my-plugin',
  transformIR(ir) {
    // Modify the IR tree before code generation
    return { ...ir, children: [] };
  }
});
```

Plugin hooks (in order): `parse → transformAST → transformIR → generate`

## Compiler Insights

The compiler emits an `insights.json` report (configurable path):

```json
{
  "timestamp": "2026-07-31T22:00:00Z",
  "components": [
    {
      "file": "page.vx",
      "reactiveDependencies": ["count"],
      "staticNodesCount": 3,
      "transitions": [
        { "name": "fadeIn", "used": true, "keyframeCount": 2, "strategy": "waapi" }
      ]
    }
  ]
}
```

Configure the output path in `defineConfig`:

```ts
export default defineConfig({
  compiler: {
    insights: {
      output: './reports/velyx-insights.json'
    }
  }
});
```

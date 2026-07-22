# 🏛️ VELYX System Architecture Documentation (v0.2.0 Core Team Edition)

**Florynx Labs Engineering**

---

## 1. Monorepo Package Topology

```mermaid
graph TD
    UserApp["User App / .vx Files"]
    AdapterVite["@velyx/adapter-vite"]
    CLI["@velyx/cli"]
    Compiler["@velyx/compiler"]
    RuntimeCore["@velyx/runtime-core"]
    RuntimeDOM["@velyx/runtime-dom"]
    RuntimeServer["@velyx/runtime-server"]
    CoreFacade["@velyx/core"]
    RuntimeFacade["@velyx/runtime"]
    DevTools["@velyx/devtools"]

    UserApp --> AdapterVite
    UserApp --> CLI
    AdapterVite --> Compiler
    CLI --> Compiler
    Compiler --> RuntimeDOM
    CoreFacade --> RuntimeCore
    RuntimeFacade --> RuntimeDOM
    RuntimeDOM --> RuntimeCore
    RuntimeServer --> RuntimeCore
    DevTools --> RuntimeCore
```

---

## 2. Compiler Pipeline & Intermediate Representation (IR)

```mermaid
flowchart LR
    SFC[".vx SFC File"] --> SFCParser["SFC Parser"]
    SFCParser --> AST["AST (Abstract Syntax Tree)"]
    AST --> IRTransformer["IR Transformer"]
    IRTransformer --> OptimizationPasses["Optimization Passes"]
    
    subgraph OptimizationPasses ["Optimization Passes Pipeline"]
        P1["StaticNodeDetectionPass"]
        P2["ConstantFoldingPass"]
        P3["ReactiveDependencyAnalysisPass"]
        P4["HydrationAnalysisPass"]
        P1 --> P2 --> P3 --> P4
    end

    OptimizationPasses --> Codegen["Code Generator"]
    Codegen --> JSOutput["ES Module Output"]
    Codegen --> Metadata["CompilationMetadata"]
```

---

## 3. Priority Scheduler & Reactive Signal Graph

```mermaid
sequenceDiagram
    participant Signal as Reactive Signal
    participant Subscriber as Effect Subscriber
    participant Scheduler as Priority Scheduler
    participant DOM as Target DOM Node

    Signal->>Subscriber: Notify value changed
    Subscriber->>Scheduler: Schedule task (PriorityLevel)
    Scheduler->>Scheduler: Queue & sort by Priority (Immediate/UserBlocking/Normal/Low/Idle)
    Scheduler->>DOM: Execute batch DOM mutations
```

---

## 4. Plugin Pipeline Lifecycle

```mermaid
flowchart TD
    RawSource["Raw .vx Source"] --> HookParse["plugin.parse()"]
    HookParse --> HookTransformAST["plugin.transformAST()"]
    HookTransformAST --> HookTransformIR["plugin.transformIR()"]
    HookTransformIR --> HookGenerate["plugin.generate()"]
    HookGenerate --> CompiledModule["Compiled ES Module"]
```

---

## 5. Performance Targets & Quality Criteria

- **Runtime Footprint**: <4KB gzip
- **Cold Start**: <5ms
- **Virtual DOM Overhead**: 0% (Zero VDOM)
- **TypeScript**: Strict Mode (Zero `any`)
- **Backwards Compatibility**: 100% (Core & Runtime Facades)

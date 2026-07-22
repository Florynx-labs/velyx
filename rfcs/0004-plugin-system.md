# RFC 0004: Compiler & DevTools Plugin System

- **RFC**: 0004
- **Author**: Florynx Labs Core Team
- **Status**: Accepted
- **Created**: 2026-07-22

## Summary
Defines the `VelyxPlugin` interface allowing third-party extensions to hook into compiler pipeline stages (parse, AST transform, IR passes, codegen) and devtools lifecycle.

## Plugin Interface

```typescript
export interface VelyxPlugin {
  name: string;
  enforce?: 'pre' | 'post';
  parse?: (source: string, filename: string) => ParsedVelyxSFC | void;
  transformAST?: (ast: TemplateNode[]) => TemplateNode[] | void;
  transformIR?: (ir: IRRootNode) => IRRootNode | void;
  generate?: (ir: IRRootNode) => string | void;
}
```

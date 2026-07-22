# RFC 0002: Reactive SPA & SSR Router

- **RFC**: 0002
- **Author**: Florynx Labs Core Team
- **Status**: Accepted
- **Created**: 2026-07-22

## Summary
Specifies the native routing system supporting SPA client-side transitions, dynamic parameter matching, nested layouts, and server-side route rendering.

## Key Features
- **Zero-Dependency Matching**: Lightweight route matcher supporting `:param` and wildcard routes.
- **Signal Integration**: `currentPath` and `params` exposed as fine-grained signals.
- **Nested Layouts**: Recursive layout composition with zero VDOM diffing.

# RFC 0001 — VELYX RFC Process & RFC Guidelines

The **Request for Comments (RFC)** process allows members of the VELYX community and core team to propose, review, and finalize significant architectural changes to the compiler, runtime, or tools.

---

## 📋 When to Submit an RFC

An RFC is required for:
* New top-level packages or adapters in the monorepo.
* Changes to Intermediate Representation (`IRRootNode`) definitions.
* Breaking changes to `@velyx/core` signal signatures or `@velyx/compiler` AST format.

---

## 📝 RFC Life Cycle

1. **Draft:** Create a pull request containing `docs/rfcs/00XX-my-feature.md`.
2. **Discussion:** Core team and community review technical trade-offs and benchmark impacts.
3. **Accepted / Rejected:** Approved RFCs are merged and tracked for implementation.

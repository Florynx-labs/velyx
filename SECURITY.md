# VELYX Security Policy & Guidelines

The VELYX core team and Florynx Labs take the security of our framework, ecosystem, and users extremely seriously. This document outlines our security practices, vulnerability reporting process, and HTML sanitization architecture.

---

## 1. Reporting a Vulnerability

If you discover a security vulnerability in VELYX (including compiler code injection, SSR XSS vector, or runtime state leak), please **do not open a public GitHub issue**.

Instead, report it directly to our security team:

* **Security Email:** `security@florynxlabs.org`
* **Response SLA:** We acknowledge all security reports within **24 hours** and provide a triaged remediation plan within **72 hours**.

Please include in your report:
1. Type of issue (e.g. Compiler Code Injection, DOM XSS, SSR Rehydration Hijacking).
2. Step-by-step reproduction code or a repository proof-of-concept.
3. Affected package version(s).
4. Any potential mitigations or patch suggestions.

---

## 2. Supported Versions

Security updates are actively applied to the following release branches:

| Version | Status | Security Support |
| :--- | :--- | :--- |
| **v0.3.x** | **Current Stable** | ✅ Active security patches & backports |
| v0.2.x | Deprecated | ⚠️ Critical fixes only until v0.4.0 release |
| < v0.2.0 | End of Life | ❌ Not supported |

---

## 3. Core Security Architecture & XSS Protections

VELYX is designed from the ground up to prevent common web security vectors:

### A. Template Code Injection (Compiler Level)
* The `@velyx/compiler` lexer sanitizes inline mustache dynamic expressions before code emission.
* HTML tags in template content are converted into strict DOM `document.createElement()` calls rather than unsafe `innerHTML` assignments.
* String attributes undergo escaping to prevent breakout out of quoted attribute contexts.

### B. Dynamic Content & Sanitization (Runtime Level)
* All dynamic text interpolations (`{{ expr }}`) use `document.createTextNode()`, ensuring that untrusted user input is rendered safely as plain text without HTML execution.
* If raw HTML rendering is explicitly required, developers must use the safe sanitization layer or explicitly trusted DOM bindings.

### C. SSR Rehydration Safety
* Server-side rendered HTML (`@velyx/server`) strips sensitive server state before sending markup to the client.
* Hydration markers (`data-vx-id`) are numeric counters and cannot be manipulated to cause DOM structure mismatch vulnerabilities.

---

## 4. Security Audit & Release Checklist

Before every minor and major release, VELYX undergoes the following security audit steps:

1. **Dependency Audit:** Zero non-peer dependencies in core packages (`@velyx/core`, `@velyx/runtime-core`).
2. **Static Analysis:** Strict TypeScript flag compliance (`noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
3. **Automated Fuzzing:** Compiler input fuzzing with invalid and malicious HTML/JS syntax inputs.
4. **Supply Chain Integrity:** All npm releases are signed with provenance attestations on npm registry.

---

*Thank you for helping keep VELYX safe for developers and users worldwide!*

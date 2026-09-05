---
name: Workspace validation compatibility
description: Compatibility constraint between generated Zod schemas and the workspace package version.
---

OpenAPI integer fields may generate helpers that are unavailable in the workspace's installed Zod major version. When codegen succeeds but the generated validation package fails on an integer helper, use a compatible numeric representation in the API contract or align the package versions before adding more routes.

**Why:** The workspace currently uses Zod 3 while the generator can emit Zod 4-style integer helpers, so this mismatch appears only during the generated library typecheck.

**How to apply:** After changing OpenAPI schemas, run codegen and the library typecheck before implementing routes; treat generated-schema failures as a contract/toolchain compatibility issue.
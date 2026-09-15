# Architectural Decision Records

ADRs preserve why consequential technical decisions were made.

Use the next sequential number and this structure:

```markdown
# NNNN: Title

## Status

Proposed | Accepted | Superseded by [NNNN](NNNN-title.md)

## Context

## Decision

## Consequences
```

Do not rewrite history after a decision is in use. Add a new ADR that supersedes
the old one. Initial accepted decisions:

- [0001: Modular monolith](0001-modular-monolith.md)
- [0002: Monorepo](0002-monorepo.md)
- [0003: Container-first development](0003-container-first.md)
- [0004: PostgreSQL persistence](0004-postgresql.md)
- [0005: REST and OpenAPI](0005-rest-openapi.md)
- [0006: Module data ownership](0006-module-data-ownership.md)
- [0007: Initial application frameworks](0007-initial-application-frameworks.md)
- [0008: Runtime and development toolchain](0008-runtime-development-toolchain.md)
- [0009: Module code boundaries](0009-module-code-boundaries.md)
- [0010: Same-origin web/API boundary](0010-same-origin-web-api-boundary.md)

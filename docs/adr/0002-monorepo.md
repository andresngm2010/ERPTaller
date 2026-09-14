# 0002: Monorepo

## Status

Accepted

## Context

Frontend, backend, contracts, infrastructure, and documentation will evolve through
coordinated vertical slices maintained by a small team.

## Decision

Keep application code, shared contracts, infrastructure definitions, scripts, and
technical documentation in one Git repository.

## Consequences

Cross-cutting changes can be reviewed and validated atomically, and repository-wide
guidance is discoverable. Tooling must avoid unnecessary coupling, and shared code
must not become an unowned catch-all.

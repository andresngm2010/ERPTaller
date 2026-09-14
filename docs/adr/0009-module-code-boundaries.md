# 0009: Module Code Boundaries

## Status

Accepted

## Context

The modular-monolith and module-ownership decisions require executable safeguards
before product modules are introduced. The safeguards need a minimal physical
convention without prescribing each module's internal architecture.

## Decision

Backend domain modules live at
`apps/api/src/erp_taller_api/modules/<canonical_module_id>/`. Frontend domain
modules live at `apps/web/src/modules/<canonical_module_id>/`. Canonical module
identifiers come from the machine-readable
[`module-registry.json`](../architecture/module-registry.json).

A backend module's cross-module surface is its `public.py` module. A frontend
module's cross-module surface is its `public.ts` module. Code in another module,
application composition code, and shared/bootstrap/infrastructure code may import
a module only through that surface. Code within a module may freely import its own
internal implementation. A public surface is intentional and narrow; it must not
automatically re-export every internal symbol.

Repository-owned architecture checks enforce canonical module directories and
static import boundaries. They use Python's AST and the TypeScript compiler API,
respectively. They do not provide an undocumented allowlist. A future exception
requires an explicit justification in an accepted architectural decision before
the checker is changed.

This convention does not mandate internal layers, repositories, use-case packages,
ports, adapters, DTOs, or any other internal methodology.

## Consequences

Common accidental cross-module coupling fails locally and in CI, including imports
from composition or shared code into module internals. A module may choose the
simplest internal structure justified by implemented requirements.

The checks analyze static Python imports and static TypeScript imports and
re-exports. Dynamic imports, runtime reflection, and all possible runtime database
access are outside their scope. Data ownership and the prohibition on direct
cross-module persistence access remain architectural requirements even where
static analysis cannot prove them.

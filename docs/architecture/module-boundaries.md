# Module Boundaries

A domain module owns its terminology, use cases, business rules, persistence
mapping, migrations, and module-specific tests. Its internal implementation is not
an integration surface.

Initial modules are:

- Identity / Access
- Customers
- Vehicles
- Workshop
- Inventory
- Purchasing
- Sales / Billing
- Cash / Payments

The machine-readable [module registry](module-registry.json) is the canonical list
of their stable logical identifiers. Documentation, issues, agents, module
directories, and architecture checks must use that registry rather than maintain a
second identifier list. Changing a canonical domain boundary or identifier requires
an explicit architectural decision.

As established by [ADR 0009](../adr/0009-module-code-boundaries.md), backend module
code lives below `apps/api/src/erp_taller_api/modules/<canonical_module_id>/` and
frontend module code below `apps/web/src/modules/<canonical_module_id>/`.

These are initial boundaries, not complete specifications. Detailed responsibilities
and relationships remain TBD and must be established from validated business needs.

## Public interfaces

Other modules may use only explicitly public application services, stable contracts,
or published internal events. Public interfaces should express business intent,
validate inputs at their boundary, and avoid leaking ORM entities or internal table
structures. Queries across ownership boundaries also go through a public interface;
reporting/read-model exceptions require an ADR.

For static code imports, a backend module exposes cross-module capabilities through
`public.py` and a frontend module through `public.ts`. These files intentionally
expose only the capabilities needed by consumers; they are not automatic exports of
all module internals. Application composition and shared/bootstrap code follow the
same public-surface rule. A module remains free to organize its own internals as its
implemented requirements justify.

Each module is the sole writer of its persistence. A shared PostgreSQL instance does
not imply shared ownership. Database foreign keys or transactions across module
boundaries require careful review and an ADR when they materially couple modules.

Future candidates such as accounting, appointments, notifications, reporting,
employees, and suppliers are possibilities only. Do not create them until scope and
ownership are justified.

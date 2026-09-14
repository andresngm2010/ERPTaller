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

Their stable logical identifiers are:

| Domain | Canonical identifier |
| --- | --- |
| Identity / Access | `identity_access` |
| Customers | `customers` |
| Vehicles | `vehicles` |
| Workshop | `workshop` |
| Inventory | `inventory` |
| Purchasing | `purchasing` |
| Sales / Billing | `sales_billing` |
| Cash / Payments | `cash_payments` |

These identifiers provide stable terminology for documentation, issues, agents,
and future architecture tests. They do not mandate the final physical Python or
TypeScript package layout, which will be established during application
scaffolding. Changing a canonical domain boundary or identifier requires an
explicit architectural decision.

These are initial boundaries, not complete specifications. Detailed responsibilities
and relationships remain TBD and must be established from validated business needs.

## Public interfaces

Other modules may use only explicitly public application services, stable contracts,
or published internal events. Public interfaces should express business intent,
validate inputs at their boundary, and avoid leaking ORM entities or internal table
structures. Queries across ownership boundaries also go through a public interface;
reporting/read-model exceptions require an ADR.

Each module is the sole writer of its persistence. A shared PostgreSQL instance does
not imply shared ownership. Database foreign keys or transactions across module
boundaries require careful review and an ADR when they materially couple modules.

Future candidates such as accounting, appointments, notifications, reporting,
employees, and suppliers are possibilities only. Do not create them until scope and
ownership are justified.

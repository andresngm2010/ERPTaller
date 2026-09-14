# Testing Strategy

Testing should provide fast feedback near business rules and confidence at module
and system boundaries.

- **Unit tests:** business rules and pure transformations within one module.
- **Application/module tests:** use cases with controlled adapters, including failure
  behavior and ownership boundaries.
- **Integration tests:** PostgreSQL mappings, migrations, HTTP adapters, and other
  real integrations where fakes would hide risk.
- **Contract/API tests:** REST behavior and OpenAPI compatibility for consumers.
- **End-to-end tests:** a small set of critical vertical journeys once product flows
  exist.

Every bug fix should normally include a regression test. Tests must be deterministic,
isolated, and readable.

## CI validation

Automated CI validation is required before merge. CI runs backend tests, Ruff,
mypy, frontend Vitest tests, ESLint, TypeScript checks, application builds, and
container/Compose validation. It also runs the backend and frontend static
module-boundary architecture checks.

The exact local commands are documented in the root [README](../../README.md).
Coverage policy and product test-data strategy remain TBD until real vertical
slices justify them.

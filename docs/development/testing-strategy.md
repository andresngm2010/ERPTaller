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

## CI target state

Automated CI validation is required before merge once the corresponding tooling
exists. CI must run applicable tests, linting, type checks, migration validation,
and build/container checks.

## Current Bootstrap 1 state

Bootstrap 2 will install the application runtime, validation tooling, commands, and
CI workflow. Until then, contributors must perform applicable validation manually
and report exactly which checks passed, were skipped, or were unavailable. Coverage
policy and test-data strategy remain TBD until the application stack is installed.

# Repository Agent Constitution

These rules apply repository-wide. A nested `AGENTS.md` may add stricter or more
specific rules for its subtree but must not contradict accepted root decisions.

## Before changing code

- Inspect nearby code, tests, documentation, and established patterns first.
- Read the relevant [architecture](docs/architecture/overview.md),
  [ADRs](docs/adr/README.md), and
  [domain documentation](docs/domain/domain-map.md).
- Keep work focused on the assigned issue. Do not perform unrelated refactors.
- Do not silently introduce frameworks, infrastructure, external services, or
  architectural patterns. Record meaningful decisions as ADRs; if uncertain,
  stop and surface options and tradeoffs.

## Architecture and ownership

- Preserve the modular monolith, monorepo, vertical-slice, container-first design.
- A domain module owns its business rules and persistence. Never directly write
  another module's data.
- Collaborate across modules only through explicit public application services,
  contracts, or internal events. Follow the
  [dependency rules](docs/architecture/dependency-rules.md) and
  [module boundaries](docs/architecture/module-boundaries.md).
- Avoid shared abstractions until a demonstrated cross-module need exists.
- Do not introduce microservices, Kubernetes, a cloud-provider dependency, or
  unapproved supporting infrastructure.

## Changes, migrations, and contracts

- Update documentation whenever behavior, terminology, workflow, or architecture
  changes. Add or supersede an ADR for consequential architectural decisions.
- Every persistence change requires an Alembic migration once persistence is
  installed. Never edit an already-applied migration; add a new one. Keep schema
  changes within the owning module and test upgrade behavior (and downgrade where
  supported).
- Treat REST/OpenAPI contracts as public interfaces. Update their definitions,
  consumers, compatibility notes, and tests together.

## Validation and Git

- Add tests at the appropriate level and run all applicable tests, linting, type
  checks, migration checks, and container/build checks. If a command is not yet
  available, state that explicitly rather than claiming it passed.
- Meet the repository [Definition of Done](docs/development/definition-of-done.md).
- Use short-lived branches, focused commits, and pull requests linked to an issue.
  Do not commit generated artifacts, secrets, credentials, or unrelated changes.
  See the [Git workflow](docs/development/git-workflow.md).

Git-tracked files are the technical source of truth. Chats, prompts, and agent
memory are not sources of truth; translate durable decisions into repository docs.

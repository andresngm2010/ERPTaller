# ERPTaller

Collaborative automotive workshop ERP, currently in repository-bootstrap phase.

The system is planned as a container-first modular monolith in a monorepo:

- `apps/web`: Next.js and TypeScript frontend (planned)
- `apps/api`: FastAPI and Python backend (planned)
- `packages/contracts`: shared, technology-neutral API contracts where justified
- `infra`: portable local/deployment infrastructure definitions
- `docs`: architecture, domain, workflow, and decision records

No product functionality or application stack has been installed yet. Exact setup
and validation commands remain TBD until the next bootstrap phase.

## Start here

1. Read [AGENTS.md](AGENTS.md) for repository-wide contribution rules.
2. Read [docs/architecture/overview.md](docs/architecture/overview.md) and the
   relevant [ADRs](docs/adr/README.md) before changing architecture.
3. Read [docs/domain/domain-map.md](docs/domain/domain-map.md) and the
   [glossary](docs/domain/glossary.md) before implementing a domain feature.
4. Follow [docs/development/agent-workflow.md](docs/development/agent-workflow.md)
   and the [Definition of Done](docs/development/definition-of-done.md).

Git-tracked documentation and code are the technical source of truth. Chat history
and agent memory are not.

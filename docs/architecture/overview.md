# Architecture Overview

ERPTaller is a container-first modular monolith in a monorepo. The web application
uses Next.js with TypeScript, the API uses FastAPI with Python, and PostgreSQL is
the initial database through SQLAlchemy and Alembic. The initial
external interface is REST documented with OpenAPI.

The modular monolith keeps deployment and operations simple while preserving
explicit business boundaries. It avoids the network, consistency, observability,
and deployment costs of premature microservices. Vertical slices should deliver
a business capability across the necessary UI, API, domain, persistence, tests,
and documentation rather than creating permanent frontend/backend silos.

## Runtime shape

The web app calls the API through documented REST contracts. The API hosts domain
modules in one deployable application. A single PostgreSQL database is acceptable,
but tables and migrations have a logical owning module. Docker Compose will be the
initial local orchestrator. Deployment must remain portable; no cloud provider is
selected and Kubernetes is out of scope.

## Collaboration between modules

Each module exposes a deliberately small public application interface. A direct
synchronous call is appropriate when the caller needs an immediate result and the
workflow can share one request boundary. Internal events may be appropriate for
decoupled reactions, multiple subscribers, or work that need not complete before
the initiating request returns. Event infrastructure and delivery guarantees are
TBD and must not be introduced speculatively.

Direct writes to another module's tables bypass its invariants, obscure ownership,
and make future change unsafe, so they are forbidden. Strong boundaries allow a
module to be extracted later by replacing its public interface with a remote one,
but extraction is not a current goal.

See [module boundaries](module-boundaries.md),
[dependency rules](dependency-rules.md), and [ADRs](../adr/README.md).

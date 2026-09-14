# 0008: Runtime and Development Toolchain

## Status

Accepted

## Context

The selected application frameworks, database, and container-first approach need
concrete runtime versions, dependency managers, quality tools, and reproducible
local and continuous-integration workflows.

## Decision

Use Python 3.14 for the backend with `uv` for dependency and virtual-environment
management. Use Ruff for linting and formatting, mypy for static type checking,
and pytest for tests. Use FastAPI, SQLAlchemy 2.x, Alembic, and PostgreSQL 18.

Use Node.js 24 LTS for the frontend with `pnpm` for dependency management. Use
Next.js 16 with the App Router and strict TypeScript. Use ESLint for linting and
Vitest for baseline unit tests.

Package the API and web application with Docker and orchestrate them with Docker
Compose. Application dependency lockfiles provide exact dependency
reproducibility. Runtime major versions are intentionally selected; resolved patch
versions belong in lockfiles and container inputs rather than this ADR.

Toolchain changes that materially alter development workflow or architecture
require a future ADR.

## Consequences

Developers and CI share explicit validation commands and reproducible dependency
graphs. The repository must maintain `uv.lock` and `pnpm-lock.yaml`, container
builds, and compatible runtime declarations. Major runtime and framework upgrades
require deliberate compatibility work rather than incidental dependency updates.

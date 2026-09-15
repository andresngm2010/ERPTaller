# ERPTaller

ERPTaller is a container-first automotive workshop ERP organized as a modular
monolith in a monorepo. The application includes its first product slice for basic
customer management and static module-boundary guardrails.

- `apps/web`: Next.js 16 and strict TypeScript frontend
- `apps/api`: FastAPI, SQLAlchemy 2, and Alembic backend
- `packages/contracts`: placeholder for justified, stable shared contracts
- `infra`: infrastructure-specific agent guidance
- `docs`: architecture, domain, workflow, and decision records

## Requirements

The primary development path requires Git and Docker with Docker Compose. For
non-container development, install Python 3.14 with `uv`, and Node.js 24 with
`pnpm`.

## Quick start

```text
git clone <repository-url>
cd ERPTaller
docker compose up -d postgres
docker compose run --rm api /app/.venv/bin/alembic upgrade head
docker compose up --build
```

The checked-in Compose defaults are safe for local development. Copy
`.env.example` to `.env` only if you need to override them.

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000>
- FastAPI docs: <http://localhost:8000/docs>
- Health endpoint: <http://localhost:8000/health>
- Customer API: <http://localhost:8000/customers>

Browser code uses same-origin Next.js `/api/*` routes, which proxy to FastAPI as
defined by [ADR 0010](docs/adr/0010-same-origin-web-api-boundary.md). `API_URL` is
server-side Next.js configuration; it defaults to `http://localhost:8000` outside
Compose, while Compose configures it as `http://api:8000`.

Stop the stack with `docker compose down`. To intentionally delete all local
database data, stop it with `docker compose down --volumes`.

## Local validation

Backend:

```text
cd apps/api
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run pytest
uv run python ../../scripts/check_backend_architecture.py
```

Set `TEST_DATABASE_URL` to a disposable PostgreSQL database to include the
customers migration and persistence integration test. CI supplies this setting;
the test is skipped when it is absent so local validation never modifies an
unidentified database.

Frontend:

```text
cd apps/web
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm architecture:check
pnpm build
```

Container configuration and builds:

```text
docker compose config
docker compose build
```

## Architecture and contribution guidance

Read [AGENTS.md](AGENTS.md), the [architecture overview](docs/architecture/overview.md),
the [ADRs](docs/adr/README.md), the [domain map](docs/domain/domain-map.md), and the
[Definition of Done](docs/development/definition-of-done.md) before making changes.
Git-tracked documentation and code are the technical source of truth.

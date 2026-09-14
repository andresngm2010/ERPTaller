# Backend Agent Guidance

- Use FastAPI and typed, modern Python; keep HTTP transport separate from future
  application and domain behavior.
- Use SQLAlchemy 2.x APIs. Each future domain module owns its persistence; never
  create cross-module repositories.
- Every schema change requires a new Alembic migration owned by the affected
  module. Never edit an applied migration.
- Inspect nearby patterns before adding abstractions or dependencies. Add a
  dependency only for an explicit need.
- Before declaring backend work complete, run the documented Ruff lint and format
  checks, mypy, pytest, and applicable migration/build checks.

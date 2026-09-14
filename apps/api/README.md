# API

The backend is a minimal FastAPI application using a `src` layout. It exposes
`GET /health`; no ERP domain modules exist yet.

## Database migrations

Alembic reads the same `DATABASE_URL` used by the application. From this directory:

```text
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run alembic downgrade -1
```

Only create a migration for a real schema change owned by a domain module. Review
generated migrations before applying them.

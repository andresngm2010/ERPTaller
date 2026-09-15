# API

The backend is a FastAPI application using a `src` layout. It exposes `GET /health`
and the first vertical product slice in the `customers` module.

## Customer API

The customer contract uses `customer_type` (`natural_person` or `company`) and a
required `display_name`. `identification`, `phone`, `email`, and `address` are
nullable. The API exposes:

- `POST /customers`
- `GET /customers`
- `GET /customers/{customer_id}`
- `PUT /customers/{customer_id}`

Create returns `201`; invalid request bodies return FastAPI's structured `422`
response, and missing detail/update targets return `404`. This is the first version
of the contract, so it has no prior compatibility obligations.

## Database migrations

Alembic reads the same `DATABASE_URL` used by the application. From this directory:

```text
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run alembic downgrade -1
```

Only create a migration for a real schema change owned by a domain module. Review
generated migrations before applying them.

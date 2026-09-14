FROM ghcr.io/astral-sh/uv:0.12.0 AS uv

FROM python:3.14.7-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

COPY --from=uv /uv /uvx /bin/
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY alembic.ini ./
COPY alembic ./alembic
COPY src ./src
RUN uv sync --frozen --no-dev

USER app

EXPOSE 8000

CMD ["/app/.venv/bin/uvicorn", "erp_taller_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

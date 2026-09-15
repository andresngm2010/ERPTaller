"""FastAPI application entry point."""

from fastapi import FastAPI
from pydantic import BaseModel

from erp_taller_api.modules.customers.public import get_customers_router


class HealthResponse(BaseModel):
    """Stable response contract for application liveness."""

    status: str


app = FastAPI(title="ERP Taller API")
app.include_router(get_customers_router())


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Report that the API process is operational."""
    return HealthResponse(status="ok")

"""Explicit customers-module surface used by application composition."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import APIRouter

__all__ = ["get_customers_router", "register_customer_models"]


def get_customers_router() -> APIRouter:
    """Load the customer HTTP adapter for FastAPI composition."""
    from .router import router

    return router


def register_customer_models() -> None:
    """Ensure customer mappings are loaded into shared migration metadata."""
    from .models import register_customer_mapping

    register_customer_mapping()

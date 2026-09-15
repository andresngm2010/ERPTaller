"""Framework-independent customer application operations."""

from collections.abc import Callable

from .domain import CustomerData, CustomerRecord


def create_customer(
    data: CustomerData, persist: Callable[[CustomerData], CustomerRecord]
) -> CustomerRecord:
    """Create a customer through the module's persistence capability."""
    return persist(data)


def list_customers(load: Callable[[], list[CustomerRecord]]) -> list[CustomerRecord]:
    """List customers in stable creation order."""
    return load()


def get_customer(
    customer_id: int, load: Callable[[int], CustomerRecord | None]
) -> CustomerRecord | None:
    """Find one customer by identifier."""
    return load(customer_id)


def update_customer(
    customer_id: int,
    data: CustomerData,
    persist: Callable[[int, CustomerData], CustomerRecord | None],
) -> CustomerRecord | None:
    """Replace a customer's editable basic information."""
    return persist(customer_id, data)

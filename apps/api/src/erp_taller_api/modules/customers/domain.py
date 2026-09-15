"""Framework-independent customer domain and application values."""

from dataclasses import dataclass
from enum import StrEnum


class CustomerType(StrEnum):
    """The supported customer categories."""

    NATURAL_PERSON = "natural_person"
    COMPANY = "company"


@dataclass(frozen=True, slots=True, kw_only=True)
class CustomerData:
    """Basic information accepted by customer application operations."""

    customer_type: CustomerType
    display_name: str
    identification: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None


@dataclass(frozen=True, slots=True, kw_only=True)
class CustomerRecord(CustomerData):
    """Application representation of a persisted customer."""

    id: int

"""Customer persistence mapping owned by the customers module."""

from sqlalchemy import CheckConstraint, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, registry

from erp_taller_api.database import metadata

mapper_registry = registry(metadata=metadata)


@mapper_registry.mapped
class Customer:
    """A customer record managed by the customers module."""

    __tablename__ = "customers"
    __table_args__ = (
        CheckConstraint(
            "customer_type IN ('natural_person', 'company')",
            name="ck_customers_customer_type",
        ),
        CheckConstraint(
            "length(trim(display_name)) > 0",
            name="ck_customers_display_name_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_type: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    identification: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)


def register_customer_mapping() -> None:
    """Confirm this module's mapping is registered in shared metadata."""
    if mapper_registry.metadata is not metadata:
        raise RuntimeError("Customer mapping is not registered in application metadata")

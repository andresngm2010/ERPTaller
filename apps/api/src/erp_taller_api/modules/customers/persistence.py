"""SQLAlchemy persistence adapter for customer application operations."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from .domain import CustomerData, CustomerRecord, CustomerType
from .models import Customer


def _to_record(customer: Customer) -> CustomerRecord:
    return CustomerRecord(
        id=customer.id,
        customer_type=CustomerType(customer.customer_type),
        display_name=customer.display_name,
        identification=customer.identification,
        phone=customer.phone,
        email=customer.email,
        address=customer.address,
    )


class SqlAlchemyCustomerStore:
    """Customers-owned concrete persistence implementation."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, data: CustomerData) -> CustomerRecord:
        customer = Customer()
        customer.customer_type = data.customer_type.value
        customer.display_name = data.display_name
        customer.identification = data.identification
        customer.phone = data.phone
        customer.email = data.email
        customer.address = data.address
        self._session.add(customer)
        self._session.commit()
        self._session.refresh(customer)
        return _to_record(customer)

    def list_all(self) -> list[CustomerRecord]:
        customers = self._session.scalars(select(Customer).order_by(Customer.id))
        return [_to_record(customer) for customer in customers]

    def get(self, customer_id: int) -> CustomerRecord | None:
        customer = self._session.get(Customer, customer_id)
        return _to_record(customer) if customer is not None else None

    def update(self, customer_id: int, data: CustomerData) -> CustomerRecord | None:
        customer = self._session.get(Customer, customer_id)
        if customer is None:
            return None
        customer.customer_type = data.customer_type.value
        customer.display_name = data.display_name
        customer.identification = data.identification
        customer.phone = data.phone
        customer.email = data.email
        customer.address = data.address
        self._session.commit()
        self._session.refresh(customer)
        return _to_record(customer)

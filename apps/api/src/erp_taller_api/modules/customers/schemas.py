"""REST contracts for customer management."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from .domain import CustomerData, CustomerRecord, CustomerType

RequiredText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
OptionalText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class CustomerInput(BaseModel):
    """Fields accepted when creating or replacing a customer."""

    customer_type: CustomerType
    display_name: RequiredText
    identification: OptionalText | None = None
    phone: OptionalText | None = None
    email: OptionalText | None = None
    address: OptionalText | None = None

    def to_application(self) -> CustomerData:
        """Translate the REST request into a framework-independent value."""
        return CustomerData(
            customer_type=self.customer_type,
            display_name=self.display_name,
            identification=self.identification,
            phone=self.phone,
            email=self.email,
            address=self.address,
        )


class CustomerResponse(CustomerInput):
    """Customer representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int

    @classmethod
    def from_application(cls, customer: CustomerRecord) -> CustomerResponse:
        """Translate an application result into the REST representation."""
        return cls.model_validate(customer)

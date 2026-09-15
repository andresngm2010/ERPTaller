"""HTTP delivery adapter for customer management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from erp_taller_api.database import get_database_session

from .persistence import SqlAlchemyCustomerStore
from .schemas import CustomerInput, CustomerResponse
from .service import create_customer, get_customer, list_customers, update_customer

router = APIRouter(prefix="/customers", tags=["customers"])
DatabaseSession = Annotated[Session, Depends(get_database_session)]


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create(customer_input: CustomerInput, session: DatabaseSession) -> CustomerResponse:
    """Create a natural-person or company customer."""
    store = SqlAlchemyCustomerStore(session)
    customer = create_customer(customer_input.to_application(), store.create)
    return CustomerResponse.from_application(customer)


@router.get("", response_model=list[CustomerResponse])
def list_all(session: DatabaseSession) -> list[CustomerResponse]:
    """List all existing customers."""
    store = SqlAlchemyCustomerStore(session)
    return [
        CustomerResponse.from_application(customer)
        for customer in list_customers(store.list_all)
    ]


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Customer not found"}},
)
def detail(customer_id: int, session: DatabaseSession) -> CustomerResponse:
    """Return one customer or a clear not-found response."""
    store = SqlAlchemyCustomerStore(session)
    customer = get_customer(customer_id, store.get)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
        )
    return CustomerResponse.from_application(customer)


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Customer not found"}},
)
def update(
    customer_id: int, customer_input: CustomerInput, session: DatabaseSession
) -> CustomerResponse:
    """Replace one customer's editable basic information."""
    store = SqlAlchemyCustomerStore(session)
    customer = update_customer(
        customer_id, customer_input.to_application(), store.update
    )
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
        )
    return CustomerResponse.from_application(customer)

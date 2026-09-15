import os
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from alembic import command
from erp_taller_api.modules.customers.domain import CustomerData, CustomerType
from erp_taller_api.modules.customers.persistence import SqlAlchemyCustomerStore
from erp_taller_api.modules.customers.service import (
    create_customer,
    get_customer,
    list_customers,
    update_customer,
)


def test_migrated_postgresql_schema_and_crud(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_url = os.getenv("TEST_DATABASE_URL")
    if database_url is None:
        pytest.skip("TEST_DATABASE_URL is required for PostgreSQL integration coverage")

    monkeypatch.setenv("DATABASE_URL", database_url)
    api_root = Path(__file__).resolve().parents[2]
    config = Config(api_root / "alembic.ini")
    command.upgrade(config, "head")
    engine = create_engine(database_url)

    try:
        inspector = inspect(engine)
        columns = {
            column["name"]: column for column in inspector.get_columns("customers")
        }
        primary_key = inspector.get_pk_constraint("customers")
        assert primary_key["constrained_columns"] == ["id"]
        assert columns["id"]["nullable"] is False
        assert columns["customer_type"]["nullable"] is False
        assert columns["display_name"]["nullable"] is False
        for field in ("identification", "phone", "email", "address"):
            assert columns[field]["nullable"] is True

        check_constraints = {
            constraint["name"]
            for constraint in inspector.get_check_constraints("customers")
        }
        assert check_constraints == {
            "ck_customers_customer_type",
            "ck_customers_display_name_not_blank",
        }

        with Session(engine, expire_on_commit=False) as session:
            store = SqlAlchemyCustomerStore(session)
            created = create_customer(
                CustomerData(
                    customer_type=CustomerType.NATURAL_PERSON,
                    display_name="Ana Pérez",
                ),
                store.create,
            )
            assert created.id > 0
            assert get_customer(created.id, store.get) == created
            assert list_customers(store.list_all) == [created]

            updated = update_customer(
                created.id,
                CustomerData(
                    customer_type=CustomerType.COMPANY,
                    display_name="Ana Pérez Servicios",
                    email="ana@example.com",
                ),
                store.update,
            )
            assert updated is not None
            assert updated.customer_type is CustomerType.COMPANY
            assert updated.email == "ana@example.com"

        invalid_rows = (
            {"customer_type": "other", "display_name": "Cliente"},
            {"customer_type": "company", "display_name": "   "},
        )
        for row in invalid_rows:
            with engine.connect() as connection:
                transaction = connection.begin()
                with pytest.raises(IntegrityError):
                    connection.execute(
                        text(
                            "INSERT INTO customers (customer_type, display_name) "
                            "VALUES (:customer_type, :display_name)"
                        ),
                        row,
                    )
                transaction.rollback()
    finally:
        engine.dispose()
        command.downgrade(config, "base")
        downgraded_engine = create_engine(database_url)
        try:
            assert "customers" not in inspect(downgraded_engine).get_table_names()
        finally:
            downgraded_engine.dispose()

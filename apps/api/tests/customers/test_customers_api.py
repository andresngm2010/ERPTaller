from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from erp_taller_api.database import get_database_session, metadata
from erp_taller_api.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    metadata.create_all(engine)
    test_session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override_session() -> Iterator[Session]:
        with test_session_factory() as session:
            yield session

    app.dependency_overrides[get_database_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    metadata.drop_all(engine)
    engine.dispose()


def test_create_list_and_detail_for_both_customer_types(client: TestClient) -> None:
    natural_person = client.post(
        "/customers",
        json={"customer_type": "natural_person", "display_name": "  Ana Pérez  "},
    )
    company = client.post(
        "/customers",
        json={
            "customer_type": "company",
            "display_name": "Taller Aliado S.A.",
            "identification": "0999999999001",
            "phone": "+593 2 555 0101",
            "email": "contacto@example.com",
            "address": "Av. Principal 123",
        },
    )

    assert natural_person.status_code == 201
    assert natural_person.json() == {
        "id": 1,
        "customer_type": "natural_person",
        "display_name": "Ana Pérez",
        "identification": None,
        "phone": None,
        "email": None,
        "address": None,
    }
    assert company.status_code == 201
    company_id = company.json()["id"]

    listed = client.get("/customers")
    detail = client.get(f"/customers/{company_id}")

    assert listed.status_code == 200
    assert [customer["customer_type"] for customer in listed.json()] == [
        "natural_person",
        "company",
    ]
    assert detail.status_code == 200
    assert detail.json() == company.json()


def test_update_replaces_basic_customer_information(client: TestClient) -> None:
    created = client.post(
        "/customers",
        json={"customer_type": "natural_person", "display_name": "Ana Pérez"},
    ).json()

    response = client.put(
        f"/customers/{created['id']}",
        json={
            "customer_type": "company",
            "display_name": "Ana Pérez Servicios",
            "email": "ana@example.com",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": created["id"],
        "customer_type": "company",
        "display_name": "Ana Pérez Servicios",
        "identification": None,
        "phone": None,
        "email": "ana@example.com",
        "address": None,
    }


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({"customer_type": "other", "display_name": "Cliente"}, "customer_type"),
        ({"customer_type": "company", "display_name": "   "}, "display_name"),
    ],
)
def test_create_returns_clear_validation_errors(
    client: TestClient, payload: dict[str, str], field: str
) -> None:
    response = client.post("/customers", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == field
    assert response.json()["detail"][0]["msg"]


def test_detail_and_update_return_not_found(client: TestClient) -> None:
    detail = client.get("/customers/999")
    update = client.put(
        "/customers/999",
        json={"customer_type": "company", "display_name": "Missing"},
    )

    assert detail.status_code == 404
    assert detail.json() == {"detail": "Customer not found"}
    assert update.status_code == 404
    assert update.json() == {"detail": "Customer not found"}

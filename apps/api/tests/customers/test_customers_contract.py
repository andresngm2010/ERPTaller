from typing import Any

from erp_taller_api.main import app


def test_customer_openapi_contract() -> None:
    schema: dict[str, Any] = app.openapi()
    paths = schema["paths"]

    assert set(paths["/customers"]) == {"get", "post"}
    assert set(paths["/customers/{customer_id}"]) == {"get", "put"}
    assert set(paths["/customers"]["get"]["responses"]) == {"200"}
    assert set(paths["/customers"]["post"]["responses"]) == {"201", "422"}
    assert set(paths["/customers/{customer_id}"]["get"]["responses"]) == {
        "200",
        "404",
        "422",
    }
    assert set(paths["/customers/{customer_id}"]["put"]["responses"]) == {
        "200",
        "404",
        "422",
    }

    schemas = schema["components"]["schemas"]
    customer_input = schemas["CustomerInput"]
    assert set(customer_input["required"]) == {"customer_type", "display_name"}
    assert schemas["CustomerType"]["enum"] == ["natural_person", "company"]

    for field in ("identification", "phone", "email", "address"):
        alternatives = customer_input["properties"][field]["anyOf"]
        assert {alternative["type"] for alternative in alternatives} == {
            "string",
            "null",
        }

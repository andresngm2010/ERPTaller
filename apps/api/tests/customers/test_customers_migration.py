from pathlib import Path

from alembic.config import Config
from pytest import MonkeyPatch
from sqlalchemy import create_engine, inspect

from alembic import command


def test_customers_migration_upgrades_and_downgrades(
    tmp_path: Path, monkeypatch: MonkeyPatch
) -> None:
    database_path = tmp_path / "migration.db"
    database_url = f"sqlite:///{database_path.as_posix()}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    api_root = Path(__file__).resolve().parents[2]
    config = Config(api_root / "alembic.ini")

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    inspector = inspect(engine)
    assert "customers" in inspector.get_table_names()
    assert {column["name"] for column in inspector.get_columns("customers")} == {
        "id",
        "customer_type",
        "display_name",
        "identification",
        "phone",
        "email",
        "address",
    }

    command.downgrade(config, "base")
    assert "customers" not in inspect(engine).get_table_names()
    engine.dispose()

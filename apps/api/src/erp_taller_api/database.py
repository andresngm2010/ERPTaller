"""SQLAlchemy bootstrap infrastructure."""

from sqlalchemy import MetaData
from sqlalchemy.engine import Engine, create_engine

from erp_taller_api.config import Settings

metadata = MetaData()


def create_database_engine(settings: Settings | None = None) -> Engine:
    """Create the application engine without opening a connection eagerly."""
    current_settings = settings or Settings.from_environment()
    return create_engine(current_settings.database_url, pool_pre_ping=True)

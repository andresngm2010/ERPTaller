"""SQLAlchemy bootstrap infrastructure."""

from collections.abc import Iterator

from sqlalchemy import MetaData
from sqlalchemy.engine import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from erp_taller_api.config import Settings

metadata = MetaData()


def create_database_engine(settings: Settings | None = None) -> Engine:
    """Create the application engine without opening a connection eagerly."""
    current_settings = settings or Settings.from_environment()
    return create_engine(current_settings.database_url, pool_pre_ping=True)


engine = create_database_engine()
session_factory = sessionmaker(bind=engine, expire_on_commit=False)


def get_database_session() -> Iterator[Session]:
    """Provide one database session for a request."""
    with session_factory() as session:
        yield session

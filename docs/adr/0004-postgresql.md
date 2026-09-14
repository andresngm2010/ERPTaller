# 0004: PostgreSQL Persistence

## Status

Accepted

## Context

The ERP requires relational persistence and transactional consistency across its
initial business capabilities. PostgreSQL provides mature tooling, portability,
and broad deployment support. The Python API also needs mature persistence support
with explicit transaction handling and PostgreSQL compatibility, while schema
changes must be reproducible across developer, CI, and deployment environments.

## Decision

Use PostgreSQL as the initial database, SQLAlchemy as the planned Python ORM, and
Alembic for migrations. One database is acceptable initially while each module
retains logical ownership of its data.

## Consequences

PostgreSQL provides a portable relational foundation with broad operational
support. SQLAlchemy supports explicit transaction handling and modular persistence
implementations without prescribing additional repository or unit-of-work
abstractions. Alembic integrates with the SQLAlchemy ecosystem so schema evolution
is version-controlled and reproducible between developer, CI, and deployment
environments. Shared physical storage must not be treated as permission for
cross-module writes. Database version, schema naming, backup policy, and production
operations remain TBD.

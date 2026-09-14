# 0006: Module Data Ownership

## Status

Accepted

## Context

A single database simplifies the initial system but can allow domain boundaries to
erode if any module can mutate any table.

## Decision

Each domain module exclusively owns its business rules, persistence mapping,
migrations, and writes. Cross-module collaboration uses explicit public application
services, contracts, or events. Direct cross-module database writes are forbidden.

## Consequences

Business invariants remain in their owning module and coupling is visible. Some
workflows require explicit coordination and may be less convenient than direct SQL.
Cross-module reporting/read models and transaction policies remain TBD and require
deliberate design when real use cases appear.

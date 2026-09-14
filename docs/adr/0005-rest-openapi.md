# 0005: REST and OpenAPI

## Status

Accepted

## Context

The planned web client and external consumers need an initially simple, documented
API strategy.

## Decision

Use REST for the initial external API and OpenAPI as its machine-readable contract.

## Consequences

API changes must update implementation, OpenAPI definitions, consumers, and tests
together. Compatibility and versioning policy remain TBD. GraphQL, RPC, and other
external API styles are not introduced without a new decision.

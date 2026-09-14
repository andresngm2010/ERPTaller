# 0001: Modular Monolith

## Status

Accepted

## Context

The ERP spans several related domains, but the team is small and does not yet need
independent service deployment or scaling. Boundaries must still remain explicit.

## Decision

Build one deployable backend as a modular monolith organized by domain modules.
Develop features as vertical slices. Do not introduce microservices at this stage.

## Consequences

Deployment, local development, and transactions remain comparatively simple.
Modules need enforced public interfaces and ownership rules to prevent accidental
coupling. A well-isolated module may be extracted later if proven necessary, but
the design will not optimize prematurely for extraction.

# 0007: Initial Application Frameworks

## Status

Accepted

## Context

The project needs productive, mature frameworks for a modular web application and
API. The backend should integrate well with OpenAPI, and both applications should
support strong typing where applicable, container portability, and deployment
without dependence on a specific cloud provider.

## Decision

Use Python with FastAPI for the backend and TypeScript with Next.js for the
frontend. Organize both applications to preserve the modular monolith and support
delivery through complete vertical slices.

## Consequences

FastAPI provides strong Python typing support and direct OpenAPI integration.
TypeScript and Next.js provide a typed frontend foundation suitable for modular
application development. Both choices have mature ecosystems, support developer
productivity, and can be packaged portably in containers without selecting a cloud
provider. The project accepts framework-specific maintenance and upgrade work; a
future architectural decision may supersede these choices when justified.

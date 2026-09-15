# 0010: Same-Origin Web/API Boundary

## Status

Accepted

## Context

Browser code needs a consistent way to reach the FastAPI REST API in local,
containerized, and future deployed environments. Direct browser-to-API calls
would expose deployment-specific API addresses and require cross-origin policy in
the backend. Next.js App Router route handlers can provide a same-origin boundary
without moving domain behavior out of its owning module.

## Decision

Browser code calls same-origin Next.js `/api/*` endpoints. Next.js route handlers
act as thin HTTP adapters that proxy to the FastAPI REST API using the server-side
`API_URL` configuration. They forward the intended HTTP method and request body,
and propagate the FastAPI response status and body. Headers are forwarded only as
required by the represented contract.

Route handlers contain no domain or business logic. Backend and frontend domain
behavior remains owned by the corresponding canonical module, and application
composition imports that module only through its `public.py` or `public.ts`
surface as required by ADR 0009.

Future modules follow this browser-to-Next.js-to-FastAPI boundary unless another
ADR supersedes this decision. Authentication remains TBD; the boundary is an
available future integration point, but this decision introduces no authentication
or authorization behavior.

## Consequences

The runtime request flow is:

```text
Browser
  -> Next.js same-origin /api/* route handlers
  -> FastAPI REST API
```

The browser does not need to know the FastAPI deployment address or negotiate CORS
for application requests. Next.js deployments must provide `API_URL`, while local
development defaults may target `http://localhost:8000`. Proxy adapters require
focused tests for request forwarding, response propagation, and backend connection
failures. FastAPI remains the authoritative REST/OpenAPI provider.

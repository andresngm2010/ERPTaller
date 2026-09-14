# Dependency Rules

Dependencies should point toward business policy and explicit contracts, not from
business rules toward framework details.

Allowed directions within a module:

1. Delivery adapters (HTTP/UI) may call application use cases.
2. Application use cases may coordinate the module's domain model and declared
   ports/interfaces.
3. Infrastructure adapters may implement those ports and use framework/ORM code.
4. Domain code must remain independent of web, database, and container tooling.

Across modules:

- Depend only on the provider module's declared public application interface,
  contract, or event.
- Never import another module's internal domain, ORM models, repositories, or
  migrations.
- Never directly write another module's tables.
- Avoid circular module dependencies. If a cycle appears, clarify ownership or
  introduce a narrow contract based on a demonstrated use case.
- `packages/contracts` is for genuinely shared, stable contracts—not general
  utilities or a dumping ground.

Prefer the simplest implementation satisfying these rules. New dependency layers,
shared kernels, event buses, or repositories require evidence and architectural
review rather than anticipation.

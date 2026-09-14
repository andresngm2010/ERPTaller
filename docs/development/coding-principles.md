# Coding Principles

- Organize business functionality by domain module and deliver vertical slices.
- Make ownership and dependencies explicit; enforce business rules in the owning
  module rather than UI, transport, or another module.
- Prefer clear, direct code over speculative layers and generalized abstractions.
- Extract shared code only after a demonstrated need and assign clear ownership.
- Keep public interfaces narrow and stable; do not expose ORM or framework internals.
- Validate at system boundaries and represent failures deliberately.
- Preserve observability and diagnosability without logging secrets or sensitive data.
- Follow existing local patterns before adding a new one.
- Keep code, tests, contracts, migrations, and documentation synchronized.

Language- and framework-specific conventions remain TBD until their stacks are
installed. Future subtree `AGENTS.md` files may define them without contradicting
the repository constitution.

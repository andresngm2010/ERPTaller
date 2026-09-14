# Agent Workflow

Agents should be able to begin without prior conversational context.

1. Read root and applicable nested `AGENTS.md` files.
2. Inspect `git status`, the issue, relevant code and tests, domain docs,
   architecture docs, and ADRs.
3. Restate the task boundary and identify the owning domain/module. Mark unknown
   business rules `TBD`; do not invent them.
4. Inspect established patterns before proposing new dependencies or abstractions.
5. Implement a focused vertical slice, including tests, contracts, migrations, and
   documentation where applicable.
6. Run the available Definition of Done checks and inspect the final diff for scope,
   secrets, ownership violations, and accidental generated files.
7. Report changes, checks and results, assumptions, risks, and unresolved items.

When architecture is uncertain, consult existing decisions first. If no decision
covers the case, present concrete options and tradeoffs and request a decision; add
an ADR when the decision is consequential. Never treat chat history or memory as
authority. Durable conclusions belong in Git-tracked files.

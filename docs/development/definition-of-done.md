# Definition of Done

A task is done only when every applicable item below is satisfied or a documented,
reviewed exception exists:

- The acceptance criteria and stated business rules are implemented as a complete,
  focused change with no unrelated modifications.
- Appropriate tests were added or updated and pass.
- Linting and formatting checks pass.
- Static type checks pass.
- Persistence changes include reviewed Alembic migrations owned by the correct
  module, with applicable migration validation.
- REST/OpenAPI or shared contract changes update providers, consumers, compatibility
  notes, and tests together.
- Architecture, domain, operational, and user-facing documentation is updated when
  the change makes it inaccurate.
- Relevant application builds, container builds, and Docker Compose validation pass.
- No secrets, credentials, machine-specific paths, generated noise, or unintended
  dependency changes are included.
- The pull request identifies affected modules, validation performed, risks,
  follow-ups, and any architectural impact.

The exact backend, frontend, and container validation commands are documented in
the root [README](../../README.md) and executed by CI. Contributors must report
which applicable checks passed, failed, or could not be run.

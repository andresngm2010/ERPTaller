# Git Workflow

Use this flow for normal work:

**Issue → short-lived branch → implementation → tests → validation → pull request
→ review → merge**

1. Start from an issue with objective, owning domain/module, acceptance criteria,
   business rules, dependencies, and out-of-scope items.
2. Create a short-lived, descriptively named branch from the current main branch.
3. Implement the smallest complete vertical slice. Developers should not be
   permanently divided into frontend-only and backend-only ownership.
4. Add tests and run all applicable validation locally.
5. Open a focused pull request linked to the issue, disclose migrations, contracts,
   documentation, architectural impact, and any unrun checks.
6. Address review and automated CI feedback, then merge according to repository
   protection settings (TBD). Perform applicable validation locally and report it
   accurately before requesting review.

Keep commits reviewable and do not mix unrelated cleanup into feature changes.
Never commit secrets. Agents must not commit or push unless explicitly instructed.

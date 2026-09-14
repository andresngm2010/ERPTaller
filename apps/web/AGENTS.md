# Frontend Agent Guidance

- Use Next.js App Router with strict TypeScript. Prefer Server Components unless
  browser-side behavior is required.
- Avoid unnecessary global client state. Do not add UI or state libraries without
  an accepted, demonstrated need.
- Keep future domain functionality modular without over-specifying its shape.
- When product APIs exist, access them through explicit application API boundaries
  rather than scattered fetch calls.
- Before declaring frontend work complete, run lint, typecheck, tests, and build.

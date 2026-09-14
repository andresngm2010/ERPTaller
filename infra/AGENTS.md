# Infrastructure Agent Guidance

- Preserve portable, container-first behavior and local reproducibility.
- Do not couple infrastructure to a cloud provider or add Kubernetes without a
  future accepted architectural decision.
- Never commit secrets or bake local `.env` contents into images.
- Add only services required by the current application; avoid speculative
  infrastructure.

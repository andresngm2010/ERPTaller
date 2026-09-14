"""Validate static Python imports against ERPTaller module boundaries."""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

PACKAGE_PREFIX = ("erp_taller_api", "modules")
MODULE_ID_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")
IGNORED_DIRECTORY_NAMES = frozenset({"__pycache__"})


class RegistryError(ValueError):
    """Raised when the canonical module registry is invalid."""


@dataclass(frozen=True, slots=True)
class Violation:
    """One actionable architecture violation."""

    source: Path
    line: int
    subject: str
    reason: str


def load_module_registry(registry_path: Path) -> frozenset[str]:
    """Load and validate canonical module identifiers from JSON."""
    try:
        raw: Any = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RegistryError(
            f"cannot read valid JSON from {registry_path}: {error}"
        ) from error

    if not isinstance(raw, dict) or set(raw) != {"modules"}:
        raise RegistryError(
            "registry must be an object containing only a 'modules' list"
        )

    modules = raw["modules"]
    if not isinstance(modules, list) or not modules:
        raise RegistryError("registry 'modules' must be a non-empty list")
    if not all(isinstance(module_id, str) for module_id in modules):
        raise RegistryError("every registry module identifier must be a string")
    if any(MODULE_ID_PATTERN.fullmatch(module_id) is None for module_id in modules):
        raise RegistryError("module identifiers must use lowercase snake_case")
    if len(modules) != len(set(modules)):
        raise RegistryError("registry module identifiers must be unique")

    return frozenset(modules)


def _source_package_parts(source: Path, source_root: Path) -> tuple[str, ...]:
    relative = source.relative_to(source_root)
    parts = (source_root.name, *relative.with_suffix("").parts)
    if parts[-1] == "__init__":
        return parts[:-1]
    return parts[:-1]


def _resolve_from_import(
    node: ast.ImportFrom, source: Path, source_root: Path
) -> tuple[str, ...]:
    module_parts = tuple(node.module.split(".")) if node.module else ()
    if node.level == 0:
        return module_parts

    package_parts = _source_package_parts(source, source_root)
    ascents = node.level - 1
    if ascents > len(package_parts):
        return ()
    base = package_parts[: len(package_parts) - ascents]
    return (*base, *module_parts)


def _target_module(parts: tuple[str, ...]) -> tuple[str, tuple[str, ...]] | None:
    if len(parts) < 3 or parts[:2] != PACKAGE_PREFIX:
        return None
    return parts[2], parts[3:]


def _source_module(source: Path, modules_root: Path) -> str | None:
    try:
        relative = source.relative_to(modules_root)
    except ValueError:
        return None
    return relative.parts[0] if len(relative.parts) > 1 else None


def _is_ignored_directory_name(name: str) -> bool:
    return name in IGNORED_DIRECTORY_NAMES


def _is_ignored_source(source: Path, source_root: Path) -> bool:
    return any(
        _is_ignored_directory_name(part)
        for part in source.relative_to(source_root).parts[:-1]
    )


def _import_targets(
    node: ast.Import | ast.ImportFrom, source: Path, source_root: Path
) -> list[tuple[str, tuple[str, ...]]]:
    if isinstance(node, ast.Import):
        return [(alias.name, tuple(alias.name.split("."))) for alias in node.names]

    base = _resolve_from_import(node, source, source_root)
    rendered_base = "." * node.level + (node.module or "")
    if base == PACKAGE_PREFIX:
        return [
            (
                f"from {rendered_base} import {alias.name}",
                (*base, *alias.name.split(".")),
            )
            for alias in node.names
        ]
    return [(f"from {rendered_base} import ...", base)]


def check_backend_architecture(
    source_root: Path, canonical_modules: frozenset[str]
) -> list[Violation]:
    """Return all canonical-directory and static-import violations."""
    source_root = source_root.resolve()
    modules_root = source_root / "modules"
    violations: list[Violation] = []

    if not source_root.is_dir():
        return [
            Violation(
                source_root,
                1,
                "backend source root",
                "configured source root does not exist or is not a directory",
            )
        ]

    if modules_root.is_dir():
        for child in sorted(modules_root.iterdir(), key=lambda path: path.name):
            if not child.is_dir() or _is_ignored_directory_name(child.name):
                continue
            if child.name not in canonical_modules:
                violations.append(
                    Violation(
                        child,
                        1,
                        child.name,
                        "domain-module directory is not in the canonical "
                        "module registry",
                    )
                )
                continue

            public_package = child / "public"
            if public_package.is_dir():
                violations.append(
                    Violation(
                        public_package,
                        1,
                        "public/",
                        "public must be the single file public.py; public/ packages "
                        "are forbidden so cross-module APIs remain explicit through "
                        "one public module",
                    )
                )

    for source in sorted(source_root.rglob("*.py")):
        if _is_ignored_source(source, source_root):
            continue
        try:
            tree = ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
        except (OSError, UnicodeError, SyntaxError) as error:
            line = (
                error.lineno if isinstance(error, SyntaxError) and error.lineno else 1
            )
            violations.append(
                Violation(source, line, "Python source", f"cannot parse: {error}")
            )
            continue

        owner = _source_module(source, modules_root)
        for node in ast.walk(tree):
            if not isinstance(node, (ast.Import, ast.ImportFrom)):
                continue
            for rendered, target_parts in _import_targets(node, source, source_root):
                target = _target_module(target_parts)
                if target is None:
                    continue
                target_module, target_remainder = target
                if target_module not in canonical_modules:
                    violations.append(
                        Violation(
                            source,
                            node.lineno,
                            rendered,
                            f"imports noncanonical module '{target_module}' not in the "
                            "canonical module registry",
                        )
                    )
                    continue
                if owner == target_module:
                    continue
                if target_remainder == ("public",):
                    continue
                violations.append(
                    Violation(
                        source,
                        node.lineno,
                        rendered,
                        f"imports module '{target_module}' outside its "
                        "public.py surface",
                    )
                )

    return violations


def _relative_display(path: Path, repository_root: Path) -> str:
    try:
        return path.resolve().relative_to(repository_root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def main(argv: list[str] | None = None) -> int:
    repository_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-root",
        type=Path,
        default=repository_root / "apps" / "api" / "src" / "erp_taller_api",
    )
    parser.add_argument(
        "--registry",
        type=Path,
        default=repository_root / "docs" / "architecture" / "module-registry.json",
    )
    args = parser.parse_args(argv)

    try:
        canonical_modules = load_module_registry(args.registry)
    except RegistryError as error:
        print(f"Backend architecture check failed: {error}", file=sys.stderr)
        return 2

    violations = check_backend_architecture(args.source_root, canonical_modules)
    if violations:
        print(f"Backend architecture check failed ({len(violations)} violation(s)):")
        for violation in violations:
            source = _relative_display(violation.source, repository_root)
            print(
                f"- {source}:{violation.line}: {violation.subject}: {violation.reason}"
            )
        return 1

    print("Backend architecture check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

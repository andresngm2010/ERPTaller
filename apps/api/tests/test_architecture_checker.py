from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
CHECKER = REPOSITORY_ROOT / "scripts" / "check_backend_architecture.py"
CANONICAL_MODULES = ["customers", "inventory"]


def run_checker(
    tmp_path: Path, files: dict[str, str]
) -> subprocess.CompletedProcess[str]:
    source_root = tmp_path / "erp_taller_api"
    source_root.mkdir()
    for relative_path, content in files.items():
        target = source_root / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    registry = tmp_path / "module-registry.json"
    registry.write_text(json.dumps({"modules": CANONICAL_MODULES}), encoding="utf-8")
    return subprocess.run(
        [
            sys.executable,
            str(CHECKER),
            "--source-root",
            str(source_root),
            "--registry",
            str(registry),
        ],
        check=False,
        capture_output=True,
        text=True,
    )


def test_same_module_internal_import_passes(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/customers/service.py": ("from .internal import helper\n"),
            "modules/customers/internal.py": "helper = object()\n",
        },
    )

    assert result.returncode == 0, result.stdout + result.stderr


def test_cross_module_public_import_passes(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/customers/service.py": (
                "from erp_taller_api.modules.inventory.public import capability\n"
            ),
            "modules/inventory/public.py": "capability = object()\n",
        },
    )

    assert result.returncode == 0, result.stdout + result.stderr


def test_public_package_fails_without_an_external_import(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/inventory/public/__init__.py": "",
            "modules/inventory/public/extra.py": "value = object()\n",
        },
    )

    assert result.returncode == 1
    assert "public/ packages are forbidden" in result.stdout
    assert "public.py" in result.stdout


def test_public_file_and_package_together_fail(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/inventory/public.py": "capability = object()\n",
            "modules/inventory/public/__init__.py": "",
        },
    )

    assert result.returncode == 1
    assert "public/ packages are forbidden" in result.stdout


def test_public_package_submodule_import_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/customers/service.py": (
                "from erp_taller_api.modules.inventory.public import extra\n"
            ),
            "modules/inventory/public/__init__.py": "",
            "modules/inventory/public/extra.py": "value = object()\n",
        },
    )

    assert result.returncode == 1
    assert "public/ packages are forbidden" in result.stdout


def test_cross_module_internal_import_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/customers/service.py": (
                "from erp_taller_api.modules.inventory.internal import secret\n"
            ),
            "modules/inventory/internal.py": "secret = object()\n",
        },
    )

    assert result.returncode == 1
    assert "erp_taller_api.modules.inventory.internal" in result.stdout
    assert "outside its public.py surface" in result.stdout


def test_cross_module_absolute_import_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/customers/service.py": (
                "import erp_taller_api.modules.inventory.internal\n"
            ),
        },
    )

    assert result.returncode == 1
    assert "erp_taller_api.modules.inventory.internal" in result.stdout


@pytest.mark.parametrize(
    "statement",
    [
        "import erp_taller_api.modules.inventory\n",
        "from erp_taller_api.modules.inventory import SomeSymbol\n",
        "from erp_taller_api.modules import inventory\n",
    ],
)
def test_cross_module_package_root_import_fails(tmp_path: Path, statement: str) -> None:
    result = run_checker(
        tmp_path,
        {"modules/customers/service.py": statement},
    )

    assert result.returncode == 1
    assert "outside its public.py surface" in result.stdout


def test_cross_module_relative_import_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "modules/customers/service.py": (
                "from ..inventory.internal import secret\n"
            ),
        },
    )

    assert result.returncode == 1
    assert "outside its public.py surface" in result.stdout


@pytest.mark.parametrize(
    "statement",
    [
        "from erp_taller_api.modules.inventory.public_helpers import X\n",
        "from erp_taller_api.modules.inventory.public.extra import X\n",
    ],
)
def test_public_name_confusion_fails(tmp_path: Path, statement: str) -> None:
    result = run_checker(
        tmp_path,
        {"modules/customers/service.py": statement},
    )

    assert result.returncode == 1
    assert "outside its public.py surface" in result.stdout


def test_unknown_public_module_reference_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {"main.py": "from erp_taller_api.modules.foo.public import X\n"},
    )

    assert result.returncode == 1
    assert "noncanonical module 'foo'" in result.stdout


def test_bootstrap_public_import_passes(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "main.py": "from erp_taller_api.modules.customers.public import register\n",
            "modules/customers/public.py": "register = object()\n",
        },
    )

    assert result.returncode == 0, result.stdout + result.stderr


def test_bootstrap_internal_import_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {
            "main.py": "import erp_taller_api.modules.customers.internal\n",
            "modules/customers/internal.py": "secret = object()\n",
        },
    )

    assert result.returncode == 1
    assert "main.py:1" in result.stdout
    assert "outside its public.py surface" in result.stdout


def test_noncanonical_module_directory_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {"modules/not_registered/internal.py": "value = object()\n"},
    )

    assert result.returncode == 1
    assert "not_registered" in result.stdout
    assert "not in the canonical module registry" in result.stdout


def test_hidden_noncanonical_module_directory_fails(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {"modules/.rogue/internal.py": "value = object()\n"},
    )

    assert result.returncode == 1
    assert ".rogue" in result.stdout
    assert "not in the canonical module registry" in result.stdout


def test_python_cache_directory_is_ignored(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {"modules/__pycache__/generated.py": "value = object()\n"},
    )

    assert result.returncode == 0, result.stdout + result.stderr


def test_syntax_error_fails_visibly(tmp_path: Path) -> None:
    result = run_checker(
        tmp_path,
        {"modules/customers/broken.py": "from (\n"},
    )

    assert result.returncode == 1
    assert "broken.py:1" in result.stdout
    assert "cannot parse" in result.stdout


def test_canonical_registry_parsing_accepts_registered_directory(
    tmp_path: Path,
) -> None:
    result = run_checker(
        tmp_path,
        {"modules/customers/internal.py": "value = object()\n"},
    )

    assert result.returncode == 0, result.stdout + result.stderr

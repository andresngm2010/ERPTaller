import subprocess
import sys
from pathlib import Path


def test_public_hook_explicitly_registers_customer_metadata() -> None:
    api_root = Path(__file__).resolve().parents[2]
    script = """
from erp_taller_api.database import metadata
from erp_taller_api.modules.customers.public import register_customer_models

assert "customers" not in metadata.tables
register_customer_models()
assert "customers" in metadata.tables
"""

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=api_root,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stdout + result.stderr

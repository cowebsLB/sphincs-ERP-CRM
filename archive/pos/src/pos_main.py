"""
POS entrypoint has been retired.

This repository is now ERP-only. Legacy POS files were archived under:
- archive/pos/
"""

from __future__ import annotations

import sys


if __name__ == "__main__":
    print("POS has been retired. Use ERP entrypoint: python src/erp_main.py")
    sys.exit(1)

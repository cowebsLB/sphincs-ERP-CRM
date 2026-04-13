from __future__ import annotations

import re
from collections import Counter
from pathlib import Path


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    blueprint = (repo / "docs" / "SPHINCS-Database-System-Design.md").read_text(encoding="utf-8")
    schema = (repo / "apps" / "core-api" / "prisma" / "schema.prisma").read_text(encoding="utf-8")

    blueprint_pairs = re.findall(r"^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)$", blueprint, re.MULTILINE)
    prisma_tables = set(re.findall(r'@@map\("([^"]+)"\)', schema))
    renamed = {
        "purchase_order_lines": "purchase_order_line_items",
        "products": "items",
    }

    missing: list[tuple[str, str]] = []
    for domain, table in blueprint_pairs:
        if table in prisma_tables:
            continue
        if table in renamed and renamed[table] in prisma_tables:
            continue
        missing.append((domain, table))

    counts = Counter(domain for domain, _ in missing)
    print(f"TOTAL_MISSING {len(missing)}")
    for domain in sorted(counts):
        print(f"{domain} {counts[domain]}")


if __name__ == "__main__":
    main()

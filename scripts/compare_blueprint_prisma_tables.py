"""Compare blueprint domain.table list to Prisma @@map table names."""
from __future__ import annotations

import re
from pathlib import Path

RE_BLUEPRINT = re.compile(r"^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)$", re.MULTILINE)
RE_MAP = re.compile(r'@@map\("([^"]+)"\)')

# Blueprint logical name (suffix) -> Prisma @@map when names differ.
RENAMED_IN_PRISMA: dict[str, str] = {
    "purchase_order_lines": "purchase_order_line_items",
    "products": "items",
}


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    bp_path = repo / "docs" / "SPHINCS-Database-System-Design.md"
    schema_path = repo / "apps" / "core-api" / "prisma" / "schema.prisma"

    bp_text = bp_path.read_text(encoding="utf-8")
    bp_pairs = RE_BLUEPRINT.findall(bp_text)
    assert len(bp_pairs) == 107, f"expected 107 blueprint refs, got {len(bp_pairs)}"
    bp_tables = {b for _, b in bp_pairs}
    domain_by_table = {b: f"{a}.{b}" for a, b in bp_pairs}

    sch = schema_path.read_text(encoding="utf-8")
    prisma_tables = set(RE_MAP.findall(sch))

    missing = set(bp_tables) - prisma_tables
    renamed_lines: list[str] = []
    for bp_suffix, prisma_name in RENAMED_IN_PRISMA.items():
        if bp_suffix not in bp_tables:
            continue
        if prisma_name not in prisma_tables:
            continue
        missing.discard(bp_suffix)
        renamed_lines.append(f"  - {domain_by_table[bp_suffix]} -> `{prisma_name}`")

    extra = prisma_tables - bp_tables
    for _bp_suffix, prisma_name in RENAMED_IN_PRISMA.items():
        extra.discard(prisma_name)

    out: list[str] = []
    out.append(f"Blueprint tables: {len(bp_tables)}")
    out.append(f"Prisma @@map tables: {len(prisma_tables)}")
    out.append("")
    out.append(f"Renamed in implementation (blueprint -> Prisma): {len(renamed_lines)}")
    out.extend(renamed_lines if renamed_lines else ["  (none)"])
    out.append("")
    out.append(f"MISSING in Prisma (no model yet): {len(missing)}")
    for t in sorted(missing):
        out.append(f"  - {domain_by_table[t]}")
    out.append("")
    out.append(
        f"EXTRA in Prisma (not in blueprint 107 list - auth, distribution, WMS detail): {len(extra)}"
    )
    for t in sorted(extra):
        out.append(f"  - {t}")

    report = "\n".join(out) + "\n"
    print(report)

    header = (
        "# Blueprint vs Prisma tables\n\n"
        "The Word blueprint defines **107** logical tables. The live Prisma schema implements a **beta subset** "
        "plus **distribution / WMS-style** tables.\n\n"
        "Regenerate:\n\n"
        "```bash\n"
        "pnpm compare:blueprint\n"
        "```\n\n"
    )
    (repo / "docs" / "blueprint-vs-prisma-tables.md").write_text(
        header + "```\n" + report + "```\n",
        encoding="utf-8",
    )
    print("Wrote docs/blueprint-vs-prisma-tables.md")


if __name__ == "__main__":
    main()

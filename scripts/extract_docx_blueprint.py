"""Extract plain text from SPHINCS_Database_System_Design.docx into a UTF-8 Markdown file."""
from __future__ import annotations

import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def paragraphs_from_docx(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    out: list[str] = []
    for p in root.findall(".//w:p", NS):
        parts: list[str] = []
        for node in p.iter():
            tag = node.tag.split("}")[-1]
            if tag == "t" and node.text:
                parts.append(node.text)
            if tag == "t" and node.tail:
                parts.append(node.tail)
        line = "".join(parts).strip()
        if line:
            out.append(line)
    return out


def paragraph_to_md(line: str) -> str:
    # Major section: "A — TITLE" or "A - TITLE" (various dashes)
    if re.match(r"^[A-Z]\s*[—–\-]\s*.+", line) and len(line) < 200:
        title = re.sub(r"^[A-Z]\s*[—–\-]\s*", "", line).strip()
        return f"\n## {title}\n"
    # Short standalone ALL CAPS heading (not table cells like VARCHAR)
    if (
        len(line) < 60
        and line.isupper()
        and " " in line
        and not line.startswith("NOT ")
        and "DEFAULT" not in line
    ):
        return f"\n### {line}\n"
    return line


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    docx = repo / "SPHINCS_Database_System_Design.docx"
    out_md = repo / "docs" / "SPHINCS-Database-System-Design.md"
    if not docx.is_file():
        print(f"Missing: {docx}", file=sys.stderr)
        sys.exit(1)

    paras = paragraphs_from_docx(docx)
    lines: list[str] = [
        "---",
        "title: SPHINCS Database System Design (extracted)",
        "source: SPHINCS_Database_System_Design.docx",
        "note: Auto-generated; edit the Word source and re-run scripts/extract_docx_blueprint.py",
        "---",
        "",
        "This file is a **UTF-8 text extraction** of the canonical Word blueprint. **Tables may render as linear text**; refer to the `.docx` for layout.",
        "",
    ]
    for p in paras:
        block = paragraph_to_md(p)
        lines.append(block)
        if block == p:  # normal paragraph, not turned into heading
            lines.append("")

    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote {len(paras)} paragraphs -> {out_md}")


if __name__ == "__main__":
    main()

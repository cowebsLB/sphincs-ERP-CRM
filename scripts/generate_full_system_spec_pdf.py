from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "sphincs-full-system-spec.md"
OUTPUT = ROOT / "output" / "pdf" / "sphincs-full-system-spec.pdf"


def parse_markdown(text: str):
    blocks = []
    current_list = []
    paragraph_lines = []

    def flush_paragraph():
        nonlocal paragraph_lines
        if paragraph_lines:
            blocks.append(("p", " ".join(line.strip() for line in paragraph_lines).strip()))
            paragraph_lines = []

    def flush_list():
        nonlocal current_list
        if current_list:
            blocks.append(("ul", current_list[:]))
            current_list = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            flush_paragraph()
            flush_list()
            continue
        if line.startswith("# "):
            flush_paragraph()
            flush_list()
            blocks.append(("h1", line[2:].strip()))
            continue
        if line.startswith("## "):
            flush_paragraph()
            flush_list()
            blocks.append(("h2", line[3:].strip()))
            continue
        if line.startswith("### "):
            flush_paragraph()
            flush_list()
            blocks.append(("h3", line[4:].strip()))
            continue
        if line.startswith("- "):
            flush_paragraph()
            current_list.append(line[2:].strip())
            continue
        if line[:2].isdigit() and line[1:3] == ". ":
            flush_paragraph()
            current_list.append(line[3:].strip())
            continue
        paragraph_lines.append(line)

    flush_paragraph()
    flush_list()
    return blocks


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "SpecTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0B0F14"),
        spaceAfter=12,
    )
    subtitle_style = ParagraphStyle(
        "SpecSubtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=18,
    )
    h2_style = ParagraphStyle(
        "SpecH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=20,
        textColor=colors.HexColor("#111827"),
        spaceBefore=10,
        spaceAfter=6,
    )
    h3_style = ParagraphStyle(
        "SpecH3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=8,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "SpecBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.2,
        leading=14.5,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=5,
    )
    bullet_style = ParagraphStyle(
        "SpecBullet",
        parent=body_style,
        leftIndent=8,
        spaceAfter=1,
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="SPHINCS Full System Specification",
        author="OpenAI Codex",
    )

    def draw_page(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#E5E7EB"))
        canvas.setLineWidth(0.6)
        canvas.line(document.leftMargin, A4[1] - 12 * mm, A4[0] - document.rightMargin, A4[1] - 12 * mm)
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.HexColor("#6B7280"))
        canvas.drawString(document.leftMargin, 8 * mm, "SPHINCS Full System Specification")
        canvas.drawRightString(A4[0] - document.rightMargin, 8 * mm, f"Page {document.page}")
        canvas.restoreState()

    story = [
        Spacer(1, 8 * mm),
        Paragraph("SPHINCS Full System Specification", title_style),
        Paragraph("Unified ERP + CRM platform blueprint for the long-term product vision", subtitle_style),
    ]

    blocks = parse_markdown(SOURCE.read_text(encoding="utf-8"))
    first_h1_skipped = False
    section_count = 0

    for kind, content in blocks:
        if kind == "h1":
            if not first_h1_skipped:
                first_h1_skipped = True
                continue
            story.append(PageBreak())
            story.append(Paragraph(content, title_style))
            continue
        if kind == "h2":
            section_count += 1
            if section_count in {7, 13, 19}:
                story.append(PageBreak())
            story.append(Paragraph(content, h2_style))
            continue
        if kind == "h3":
            story.append(Paragraph(content, h3_style))
            continue
        if kind == "p":
            story.append(Paragraph(content.replace("&", "&amp;"), body_style))
            continue
        if kind == "ul":
            items = [
                ListItem(Paragraph(item.replace("&", "&amp;"), bullet_style), leftIndent=10)
                for item in content
            ]
            story.append(
                ListFlowable(
                    items,
                    bulletType="bullet",
                    start="circle",
                    bulletFontName="Helvetica",
                    bulletFontSize=8,
                    leftIndent=12,
                )
            )
            story.append(Spacer(1, 2))

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)


if __name__ == "__main__":
    build_pdf()

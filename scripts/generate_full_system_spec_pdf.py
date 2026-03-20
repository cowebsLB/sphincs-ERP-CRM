from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
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
LOGO = ROOT / "assets" / "branding" / "android-chrome-512x512.png"

PAGE_WIDTH, PAGE_HEIGHT = A4
COLOR_BG = colors.HexColor("#0B0F14")
COLOR_SURFACE = colors.HexColor("#121821")
COLOR_BORDER = colors.HexColor("#1F2A37")
COLOR_TEXT = colors.HexColor("#E5E7EB")
COLOR_TEXT_DARK = colors.HexColor("#1F2937")
COLOR_MUTED = colors.HexColor("#6B7280")
COLOR_GOLD = colors.HexColor("#F59E0B")
COLOR_GOLD_DARK = colors.HexColor("#D97706")
COLOR_GOLD_SOFT = colors.Color(245 / 255, 158 / 255, 11 / 255, alpha=0.12)


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
        if len(line) > 3 and line[:2].isdigit() and line[2] == " ":
            flush_paragraph()
            current_list.append(line[3:].strip())
            continue
        paragraph_lines.append(line)

    flush_paragraph()
    flush_list()
    return blocks


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    cover_kicker_style = ParagraphStyle(
        "CoverKicker",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        alignment=TA_CENTER,
        textColor=COLOR_GOLD,
        spaceAfter=10,
        tracking=0.5,
    )
    cover_title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        alignment=TA_CENTER,
        textColor=COLOR_TEXT,
        spaceAfter=10,
    )
    cover_subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#D1D5DB"),
        spaceAfter=18,
    )
    cover_meta_style = ParagraphStyle(
        "CoverMeta",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#CBD5E1"),
        spaceAfter=2,
    )
    h2_style = ParagraphStyle(
        "SpecH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14.5,
        leading=18,
        textColor=colors.HexColor("#111827"),
        backColor=COLOR_GOLD_SOFT,
        borderPadding=(8, 10, 8),
        borderColor=COLOR_GOLD,
        borderWidth=0.6,
        borderRadius=4,
        spaceBefore=12,
        spaceAfter=8,
    )
    h3_style = ParagraphStyle(
        "SpecH3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11.3,
        leading=14,
        textColor=COLOR_GOLD_DARK,
        spaceBefore=8,
        spaceAfter=5,
    )
    body_style = ParagraphStyle(
        "SpecBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.1,
        leading=14.8,
        alignment=TA_JUSTIFY,
        textColor=COLOR_TEXT_DARK,
        spaceAfter=6,
    )
    bullet_style = ParagraphStyle(
        "SpecBullet",
        parent=body_style,
        leftIndent=8,
        spaceAfter=2,
    )
    header_title_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.3,
        leading=10,
        textColor=COLOR_SURFACE,
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title="SPHINCS Full System Specification",
        author="OpenAI Codex",
    )

    logo_reader = ImageReader(str(LOGO)) if LOGO.exists() else None

    def draw_cover(canvas, document):
        canvas.saveState()

        canvas.setFillColor(COLOR_BG)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

        canvas.setFillColor(COLOR_GOLD)
        canvas.rect(0, PAGE_HEIGHT - 14 * mm, PAGE_WIDTH, 5 * mm, fill=1, stroke=0)

        canvas.setFillColor(colors.HexColor("#10233A"))
        canvas.rect(0, PAGE_HEIGHT - 58 * mm, PAGE_WIDTH, 35 * mm, fill=1, stroke=0)

        canvas.setFillColor(colors.HexColor("#1E293B"))
        canvas.roundRect(18 * mm, 28 * mm, PAGE_WIDTH - 36 * mm, 32 * mm, 8, fill=1, stroke=0)

        if logo_reader:
            canvas.drawImage(
                logo_reader,
                PAGE_WIDTH / 2 - 18 * mm,
                PAGE_HEIGHT - 86 * mm,
                width=36 * mm,
                height=36 * mm,
                preserveAspectRatio=True,
                mask="auto",
            )

        canvas.setStrokeColor(colors.HexColor("#334155"))
        canvas.setLineWidth(0.7)
        canvas.line(18 * mm, 18 * mm, PAGE_WIDTH - 18 * mm, 18 * mm)

        canvas.setFillColor(colors.HexColor("#CBD5E1"))
        canvas.setFont("Helvetica", 9)
        canvas.drawString(18 * mm, 10 * mm, "SPHINCS")
        canvas.drawRightString(PAGE_WIDTH - 18 * mm, 10 * mm, "Full System Specification")

        canvas.restoreState()

    def draw_inner_page(canvas, document):
        canvas.saveState()

        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

        canvas.setFillColor(colors.HexColor("#F8FAFC"))
        canvas.rect(0, PAGE_HEIGHT - 18 * mm, PAGE_WIDTH, 18 * mm, fill=1, stroke=0)

        canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
        canvas.setLineWidth(0.6)
        canvas.line(document.leftMargin, PAGE_HEIGHT - 18 * mm, PAGE_WIDTH - document.rightMargin, PAGE_HEIGHT - 18 * mm)

        if logo_reader:
            canvas.drawImage(
                logo_reader,
                document.leftMargin,
                PAGE_HEIGHT - 15.5 * mm,
                width=8 * mm,
                height=8 * mm,
                preserveAspectRatio=True,
                mask="auto",
            )

        canvas.setFont("Helvetica-Bold", 9.5)
        canvas.setFillColor(COLOR_SURFACE)
        canvas.drawString(document.leftMargin + 11 * mm, PAGE_HEIGHT - 12.6 * mm, "SPHINCS Full System Specification")

        canvas.setStrokeColor(colors.HexColor("#E5E7EB"))
        canvas.line(document.leftMargin, 14 * mm, PAGE_WIDTH - document.rightMargin, 14 * mm)
        canvas.setFont("Helvetica", 8.8)
        canvas.setFillColor(COLOR_MUTED)
        canvas.drawString(document.leftMargin, 8.8 * mm, "Draft platform blueprint")
        canvas.drawRightString(PAGE_WIDTH - document.rightMargin, 8.8 * mm, f"Page {document.page}")

        canvas.restoreState()

    story = [Spacer(1, 78 * mm)]

    if LOGO.exists():
        story.append(Image(str(LOGO), width=26 * mm, height=26 * mm))
        story.append(Spacer(1, 8 * mm))

    story.extend(
        [
            Paragraph("Product Blueprint", cover_kicker_style),
            Paragraph("SPHINCS Full System Specification", cover_title_style),
            Paragraph(
                "Unified ERP + CRM platform blueprint for the long-term product vision, tenant structure, operational workflows, and relational system model.",
                cover_subtitle_style,
            ),
            Paragraph("Date: 2026-03-20", cover_meta_style),
            Paragraph("Status: Draft platform blueprint", cover_meta_style),
            Paragraph("Audience: product, engineering, design, operations, future collaborators", cover_meta_style),
            Spacer(1, 24 * mm),
        ]
    )

    summary_card = KeepTogether(
        [
            Paragraph(
                "<b>Purpose</b><br/>This document defines the intended end-state shape of SPHINCS so product, engineering, and future roadmap decisions can align to one connected system vision.",
                ParagraphStyle(
                    "SummaryCard",
                    parent=body_style,
                    alignment=TA_CENTER,
                    textColor=colors.HexColor("#E2E8F0"),
                    backColor=colors.HexColor("#1E293B"),
                    borderPadding=(12, 14, 12),
                    borderRadius=6,
                    spaceAfter=0,
                ),
            )
        ]
    )
    story.append(summary_card)
    story.append(PageBreak())

    blocks = parse_markdown(SOURCE.read_text(encoding="utf-8"))
    first_h1_skipped = False

    for kind, content in blocks:
        if kind == "h1":
            if not first_h1_skipped:
                first_h1_skipped = True
            else:
                story.append(PageBreak())
            continue
        if kind == "h2":
            story.append(Paragraph(esc(content), h2_style))
            story.append(Spacer(1, 2))
            continue
        if kind == "h3":
            story.append(Paragraph(esc(content), h3_style))
            continue
        if kind == "p":
            story.append(Paragraph(esc(content), body_style))
            continue
        if kind == "ul":
            items = [
                ListItem(Paragraph(esc(item), bullet_style), leftIndent=10)
                for item in content
            ]
            story.append(
                ListFlowable(
                    items,
                    bulletType="bullet",
                    start="bullet",
                    bulletFontName="Helvetica",
                    bulletFontSize=8,
                    bulletColor=COLOR_GOLD_DARK,
                    leftIndent=14,
                )
            )
            story.append(Spacer(1, 3))

    story.append(Spacer(1, 5 * mm))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#D1D5DB")))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "SPHINCS is designed to grow from a connected core: people, permissions, customers, operations, records, and accountability moving together as one system.",
            ParagraphStyle(
                "ClosingNote",
                parent=body_style,
                alignment=TA_CENTER,
                textColor=COLOR_MUTED,
                fontSize=9.3,
            ),
        )
    )

    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_inner_page)


if __name__ == "__main__":
    build_pdf()

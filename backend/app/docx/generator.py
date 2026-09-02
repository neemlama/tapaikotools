import io
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH

from app.pdf.extractor import PageContent
from app.layout.paragraphs import lines_to_paragraphs
from app.docx.styles import set_run_font
from app.docx.paragraphs import apply_alignment, set_paragraph_spacing
from app.docx.tables import create_word_table
from app.docx.images import add_image_to_doc


def _estimate_alignment(line, page_width: float) -> str:
    # Simple: centered if x near middle, right if near right
    x0 = line.bbox[0]
    x1 = line.bbox[2]
    center = (x0 + x1) / 2
    if abs(center - page_width / 2) < page_width * 0.1 and (x1 - x0) < page_width * 0.6:
        return "center"
    if x0 > page_width * 0.6:
        return "right"
    return "left"


def build_docx(pages: list[PageContent], pdf_bytes: bytes) -> bytes:
    doc = Document()

    # Set default narrow margins for closer visual match
    for section in doc.sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    # Try to detect page size from first page
    if pages:
        first = pages[0]
        # Points to inches
        w_in = first.width / 72
        h_in = first.height / 72
        # Update section size if not A4
        for section in doc.sections:
            section.page_width = Inches(w_in)
            section.page_height = Inches(h_in)

    for p_idx, page in enumerate(pages):
        # Handle page break: new section for each PDF page after first (keeps pagination)
        if p_idx > 0:
            doc.add_page_break()

        # Column detection — if 2 columns, create 2-col section
        from app.layout.columns import detect_columns

        ncols = detect_columns(page)
        if ncols == 2:
            # Note: python-docx doesn't truly support columns, but we can hint
            # For now, just continue — reading order already top→bottom; a true column
            # reconstruction would need section columns. We log for future.
            pass

        # Tables — try pdfplumber first
        from app.pdf.tables import detect_tables_with_pdfplumber

        tables = detect_tables_with_pdfplumber(pdf_bytes, p_idx)
        table_inserted = False
        if tables:
            for t in tables:
                create_word_table(doc, t.rows)
                doc.add_paragraph("")  # spacing after table
                table_inserted = True
            # If tables found, skip text blocks that are inside tables to avoid duplication
            # Heuristic: if we found tables, don't also render text blocks (avoid double)
            # For MVP, we still render text but tables are primary
            # We choose to render tables + skip pure text rendering if tables cover most content
            if table_inserted and len(tables) >= 1:
                # Check if tables cover >60% of text — if so, skip text rendering for this page
                total_cells = sum(len(r) for t in tables for r in t.rows)
                if total_cells > 10:
                    # Still add images
                    for img in page.images:
                        try:
                            from app.pdf.images import pixmap_to_bytes

                            b = pixmap_to_bytes(img["pixmap"])
                            bbox = img["bbox"]
                            w_pt = bbox[2] - bbox[0]
                            add_image_to_doc(doc, b, width_pt=w_pt)
                        except Exception:
                            continue
                    continue

        # Paragraphs
        paras = lines_to_paragraphs(page)
        for para_lines in paras:
            if not para_lines:
                continue
            p = doc.add_paragraph()
            # Determine alignment from first line
            align = _estimate_alignment(para_lines[0], page.width)
            apply_alignment(p, align)
            set_paragraph_spacing(p, before=0, after=4)

            # Heading detection: if any line is heading
            # Use size heuristic
            for line in para_lines:
                for span in line.spans:
                    run = p.add_run(span.text + " ")
                    set_run_font(run, span)
                # Add line break within paragraph unless last line
                if line is not para_lines[-1]:
                    # Instead of <w:br/>, just add space — paragraph handles wrapping
                    # For hard breaks inside PDF, we keep as space to allow reflow
                    pass
            # Trim trailing space
            if p.runs and p.runs[-1].text.endswith(" "):
                p.runs[-1].text = p.runs[-1].text[:-1]

            # Detect heading style: large + bold → bump size
            # Already handled via font size; optionally set style
            avg_size = sum(s.size for l in para_lines for s in l.spans) / max(1, sum(len(l.spans) for l in para_lines))
            if avg_size > 14 and any(s.bold for l in para_lines for s in l.spans):
                p.style = doc.styles["Heading 2"] if avg_size < 18 else doc.styles["Heading 1"]

        # Images after text
        for img in page.images:
            try:
                from app.pdf.images import pixmap_to_bytes

                b = pixmap_to_bytes(img["pixmap"])
                bbox = img["bbox"]
                w_pt = bbox[2] - bbox[0]
                add_image_to_doc(doc, b, width_pt=w_pt)
            except Exception:
                continue

        # If page had no text and no tables/images, add empty paragraph to preserve page count
        if not paras and not page.images and not table_inserted:
            doc.add_paragraph("")

    # Save to bytes
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()

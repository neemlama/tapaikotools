import fitz
from app.pdf.parser import validate_pdf
from app.pdf.extractor import extract_page
from app.pdf.analyzer import is_scanned_page
from app.docx.generator import build_docx


def convert_pdf_to_docx(pdf_bytes: bytes, filename: str) -> tuple[bytes, dict]:
    validate_pdf(pdf_bytes)

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    warnings: list[str] = []
    ocr_pages = 0

    for pno in range(doc.page_count):
        try:
            page = extract_page(doc, pno)
            # OCR fallback if scanned
            if is_scanned_page(page):
                ocr_pages += 1
                warnings.append(f"Page {pno+1} appears scanned — OCR not yet enabled, text may be missing. Install Tesseract/PaddleOCR for full support.")
                # For now, keep empty — OCR can be added later
            pages.append(page)
        except Exception as e:
            warnings.append(f"Page {pno+1} extraction failed: {e}")
            # Create empty page to keep pagination
            from app.pdf.extractor import PageContent

            pages.append(PageContent(width=595, height=842, blocks=[], images=[], has_text=False, drawings=[]))

    doc.close()

    # Handle columns/headers detection hooks (no-op for now)
    # Build docx
    try:
        docx_bytes = build_docx(pages, pdf_bytes)
    except Exception as e:
        raise RuntimeError(f"DOCX generation failed: {e}") from e

    # Validate output is non-empty and is a zip (docx)
    if len(docx_bytes) < 500 or docx_bytes[:2] != b"PK":
        warnings.append("Generated DOCX seems unusually small — layout may be incomplete.")

    meta = {
        "pages": len(pages),
        "ocr_pages": ocr_pages,
        "warnings": warnings,
        "status": "completed_with_warnings" if warnings else "completed",
    }
    return docx_bytes, meta

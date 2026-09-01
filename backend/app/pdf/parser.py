import fitz  # PyMuPDF


def validate_pdf(data: bytes) -> None:
    if len(data) < 5 or data[:5] != b"%PDF-":
        raise ValueError("Invalid PDF signature")
    # Try open to detect corruption
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        if doc.page_count == 0:
            raise ValueError("PDF has no pages")
        doc.close()
    except Exception as e:
        raise ValueError(f"Corrupted PDF: {e}") from e

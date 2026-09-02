import io


def pixmap_to_bytes(pix) -> bytes:
    """Convert fitz Pixmap to PNG/JPEG bytes for embedding in DOCX."""
    try:
        # Pixmap.tobytes handles alpha
        return pix.tobytes("png")
    except Exception:
        return pix.tobytes("png")

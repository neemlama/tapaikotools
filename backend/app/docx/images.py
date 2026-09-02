import io
from docx.shared import Inches, Emu


def add_image_to_doc(doc, image_bytes: bytes, width_pt: float | None = None):
    """Add image centered. width_pt is PDF points (1/72 inch)."""
    # Word width: convert points to inches
    from docx.shared import Pt

    # Determine size: use PDF bbox width, but cap to page width
    # Default: scale to ~6 inches max
    bio = io.BytesIO(image_bytes)
    paragraph = doc.add_paragraph()
    paragraph.alignment = 1  # center
    run = paragraph.add_run()
    # Estimate: if width_pt given, use it, else auto
    if width_pt and width_pt > 0:
        inches = min(width_pt / 72, 6.0)
        run.add_picture(bio, width=Inches(inches))
    else:
        run.add_picture(bio, width=Inches(4.5))
    return paragraph

"""Style helpers for python-docx."""

from docx.shared import Pt, RGBColor


def set_run_font(run, span):
    run.font.size = Pt(span.size * 0.85)  # scale down slightly for Word
    run.bold = span.bold
    run.italic = span.italic
    # color: span.color is 0xRRGGBB
    try:
        if span.color != 0:
            r = (span.color >> 16) & 0xFF
            g = (span.color >> 8) & 0xFF
            b = span.color & 0xFF
            # Skip near-black
            if not (r < 20 and g < 20 and b < 20):
                run.font.color.rgb = RGBColor(r, g, b)
    except Exception:
        pass
    # Font family: map common PDF fonts to Word-safe
    fam = (span.font or "").lower()
    if "courier" in fam or "mono" in fam:
        run.font.name = "Courier New"
    elif "helvetica" in fam or "arial" in fam:
        run.font.name = "Calibri"
    elif "times" in fam:
        run.font.name = "Times New Roman"

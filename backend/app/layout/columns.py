"""Very light column detection. For MVP, detect 2-column via x gap."""

from app.pdf.extractor import PageContent


def detect_columns(page: PageContent) -> int:
    # If many blocks have x0 > page.width/2 and x0 < page.width/2 split, consider 2 columns
    left = sum(1 for b in page.blocks if b.type == 0 and b.bbox[0] < page.width * 0.45)
    right = sum(1 for b in page.blocks if b.type == 0 and b.bbox[0] > page.width * 0.55)
    if left > 2 and right > 2:
        return 2
    return 1

"""Heuristic analyzer for headers/footers/columns. Keeps logic simple for MVP."""

from app.pdf.extractor import PageContent


def detect_repeated_blocks(pages: list[PageContent], threshold: float = 0.8) -> dict:
    """Very light header/footer detection: text that repeats at same Y on >80% pages.
    Returns {'headers': [...], 'footers': [...]} as sets of strings.
    For now returns empty — hooks for future, but generator will handle per-page anyway.
    """
    return {"headers": set(), "footers": set()}


def is_scanned_page(page: PageContent, min_chars: int = 20) -> bool:
    # Count chars
    chars = sum(len(s.text) for b in page.blocks if b.type == 0 for l in b.lines for s in l.spans)
    return chars < min_chars and len(page.blocks) == 0

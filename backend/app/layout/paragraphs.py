"""Group lines into paragraphs: merge lines that are continuous vs separate blocks."""

from app.pdf.extractor import PageContent, Line, Span


def lines_to_paragraphs(page: PageContent) -> list[list[Line]]:
    """Group page lines into paragraphs.
    Heuristic: gap > 1.5*line_height or indent change → new paragraph.
    Also respects explicit block boundaries from PyMuPDF.
    """
    paragraphs: list[list[Line]] = []
    current: list[Line] = []
    prev_y1: float | None = None
    prev_x0: float | None = None

    # Flatten all lines in reading order (top→bottom, left→right already from dict)
    all_lines: list[Line] = []
    for b in page.blocks:
        if b.type == 0:
            all_lines.extend(b.lines)

    for line in all_lines:
        if not line.spans:
            continue
        x0 = line.bbox[0]
        y0 = line.bbox[1]
        y1 = line.bbox[3]
        height = y1 - y0 or 12

        if prev_y1 is not None:
            gap = y0 - prev_y1
            # New paragraph if vertical gap large or indent shifts significantly
            indent_change = abs(x0 - (prev_x0 or x0))
            if gap > height * 0.8 or indent_change > 20:
                if current:
                    paragraphs.append(current)
                    current = []
        current.append(line)
        prev_y1 = y1
        prev_x0 = x0

    if current:
        paragraphs.append(current)
    return paragraphs

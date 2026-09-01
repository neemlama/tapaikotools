"""Heading detection via font size vs body median."""

from app.pdf.extractor import PageContent


def detect_headings(page: PageContent) -> set[int]:
    # Collect sizes
    sizes = [s.size for b in page.blocks if b.type == 0 for l in b.lines for s in l.spans]
    if not sizes:
        return set()
    sizes_sorted = sorted(sizes)
    median = sizes_sorted[len(sizes_sorted) // 2]
    # Line is heading if avg size > median*1.25 and bold
    heading_line_indices = set()
    line_idx = 0
    for b in page.blocks:
        if b.type != 0:
            continue
        for l in b.lines:
            if not l.spans:
                line_idx += 1
                continue
            avg_size = sum(s.size for s in l.spans) / len(l.spans)
            any_bold = any(s.bold for s in l.spans)
            if avg_size > median * 1.25 and (any_bold or avg_size > median * 1.4):
                heading_line_indices.add(line_idx)
            line_idx += 1
    return heading_line_indices

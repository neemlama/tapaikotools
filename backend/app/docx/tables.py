from docx.shared import Pt


def create_word_table(doc, rows: list[list[str]]):
    if not rows:
        return None
    ncol = max(len(r) for r in rows)
    nrow = len(rows)
    table = doc.add_table(rows=nrow, cols=ncol)
    table.style = "Light Grid Accent 1"
    table.autofit = True
    for i, row in enumerate(rows):
        for j, cell_text in enumerate(row):
            if j >= ncol:
                continue
            cell = table.cell(i, j)
            cell.text = cell_text or ""
            # Make header bold
            if i == 0:
                for p in cell.paragraphs:
                    for r in p.runs:
                        r.bold = True
    return table

from dataclasses import dataclass


@dataclass
class TableCandidate:
    bbox: tuple[float, float, float, float]
    rows: list[list[str]]
    nrow: int
    ncol: int


def detect_tables_with_pdfplumber(pdf_bytes: bytes, pno: int) -> list[TableCandidate]:
    """Try pdfplumber table extraction as secondary signal. Fallback gracefully."""
    try:
        import pdfplumber
        import io

        out: list[TableCandidate] = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            if pno >= len(pdf.pages):
                return []
            page = pdf.pages[pno]
            tables = page.extract_tables() or []
            for t in tables:
                if not t or len(t) < 1:
                    continue
                # Clean
                rows = [[(cell or "").strip() for cell in row] for row in t if any(cell for cell in row)]
                if len(rows) < 2:
                    continue
                ncol = max(len(r) for r in rows)
                # Normalize
                rows = [r + [""] * (ncol - len(r)) for r in rows]
                out.append(TableCandidate(bbox=(0, 0, 0, 0), rows=rows, nrow=len(rows), ncol=ncol))
        return out
    except Exception:
        return []

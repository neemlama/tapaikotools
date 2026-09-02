import fitz
from dataclasses import dataclass


@dataclass
class Span:
    text: str
    bbox: tuple[float, float, float, float]
    font: str
    size: float
    color: int
    bold: bool
    italic: bool
    flags: int


@dataclass
class Line:
    spans: list[Span]
    bbox: tuple[float, float, float, float]


@dataclass
class Block:
    lines: list[Line]
    bbox: tuple[float, float, float, float]
    type: int  # 0=text, 1=image


@dataclass
class PageContent:
    width: float
    height: float
    blocks: list[Block]
    images: list[dict]
    has_text: bool
    drawings: list[dict]  # for table detection


def extract_page(doc: fitz.Document, pno: int) -> PageContent:
    page = doc.load_page(pno)
    width, height = page.rect.width, page.rect.height

    # Text blocks with dict
    d = page.get_text("dict")
    blocks: list[Block] = []
    has_text = False

    for b in d.get("blocks", []):
        if b["type"] == 0:  # text
            lines: list[Line] = []
            for l in b.get("lines", []):
                spans: list[Span] = []
                for s in l.get("spans", []):
                    txt = s.get("text", "")
                    if txt.strip():
                        has_text = True
                    # flags: 16=bold, 2=italic, 8=serif etc — simplified
                    flags = s.get("flags", 0)
                    bold = bool(flags & 16)
                    italic = bool(flags & 2)
                    spans.append(
                        Span(
                            text=txt,
                            bbox=tuple(s.get("bbox", (0, 0, 0, 0))),
                            font=s.get("font", ""),
                            size=s.get("size", 11),
                            color=s.get("color", 0),
                            bold=bold,
                            italic=italic,
                            flags=flags,
                        )
                    )
                if spans:
                    lines.append(Line(spans=spans, bbox=tuple(l.get("bbox", (0, 0, 0, 0)))))
            if lines:
                blocks.append(Block(lines=lines, bbox=tuple(b.get("bbox", (0, 0, 0, 0))), type=0))
        elif b["type"] == 1:  # image
            blocks.append(Block(lines=[], bbox=tuple(b.get("bbox", (0, 0, 0, 0))), type=1))

    # Images with binary
    images = []
    for img in page.get_images(full=True):
        try:
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            # Convert CMYK to RGB if needed
            if pix.n > 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            # Get bbox for this image via get_image_rects
            rects = page.get_image_rects(img)
            for r in rects:
                images.append(
                    {
                        "bbox": (r.x0, r.y0, r.x1, r.y1),
                        "width": pix.width,
                        "height": pix.height,
                        "pixmap": pix,
                        "ext": "png" if pix.alpha else "jpeg",
                    }
                )
            # Keep one pix reference to avoid GC
            # Note: pix will be used later for embedding
        except Exception:
            continue

    # Drawings for table detection (lines/rects)
    drawings = page.get_drawings()

    return PageContent(width=width, height=height, blocks=blocks, images=images, has_text=has_text, drawings=drawings)

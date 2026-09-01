from dataclasses import dataclass


@dataclass
class TextBlock:
    text: str
    bbox: tuple[float, float, float, float]
    font: str
    size: float
    bold: bool
    italic: bool
    color: int
    align: str  # left, center, right, justify
    line_spacing: float = 1.0

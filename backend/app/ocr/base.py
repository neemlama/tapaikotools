from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class OcrWord:
    text: str
    bbox: tuple[float, float, float, float]  # x0, y0, x1, y1
    confidence: float = 1.0


@dataclass
class OcrPage:
    words: list[OcrWord]
    width: float
    height: float


class OcrEngine(ABC):
    @abstractmethod
    def ocr_page(self, image_bytes: bytes, width: float, height: float) -> OcrPage:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

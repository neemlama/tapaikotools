from app.ocr.base import OcrEngine, OcrPage


class PaddleOcr(OcrEngine):
    # Stub — PaddleOCR is heavy and optional. Falls back to Tesseract or no OCR.
    @property
    def name(self) -> str:
        return "paddleocr"

    def ocr_page(self, image_bytes: bytes, width: float, height: float) -> OcrPage:
        raise RuntimeError("PaddleOCR not installed — install paddlepaddle + paddleocr to enable")

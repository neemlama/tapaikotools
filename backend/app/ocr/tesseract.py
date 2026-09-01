try:
    import pytesseract  # type: ignore
    from PIL import Image
    import io

    HAS_TESSERACT = True
except Exception:
    HAS_TESSERACT = False

from app.ocr.base import OcrEngine, OcrPage, OcrWord


class TesseractOcr(OcrEngine):
    @property
    def name(self) -> str:
        return "tesseract"

    def ocr_page(self, image_bytes: bytes, width: float, height: float) -> OcrPage:
        if not HAS_TESSERACT:
            raise RuntimeError("pytesseract not installed")
        img = Image.open(io.BytesIO(image_bytes))
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        words: list[OcrWord] = []
        n = len(data["text"])
        for i in range(n):
            txt = (data["text"][i] or "").strip()
            if not txt:
                continue
            x = float(data["left"][i])
            y = float(data["top"][i])
            w = float(data["width"][i])
            h = float(data["height"][i])
            # Scale from image pixels to PDF points
            # image was rendered at 2x scale, width/height passed are PDF points
            # Approximate: map image coords back to PDF coords
            # For MVP, use proportional scaling
            scale_x = width / img.width if img.width else 1
            scale_y = height / img.height if img.height else 1
            bbox = (x * scale_x, y * scale_y, (x + w) * scale_x, (y + h) * scale_y)
            conf = float(data["conf"][i]) / 100 if data["conf"][i] != -1 else 0.8
            words.append(OcrWord(text=txt, bbox=bbox, confidence=conf))
        return OcrPage(words=words, width=width, height=height)

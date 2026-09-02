# PDF → DOCX Backend

Editable PDF to Word converter using **PyMuPDF + python-docx**.

## Quick start

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# -> http://localhost:8000/docs
```

Health:
```bash
curl http://localhost:8000/api/health
```

Convert:
```bash
curl -F "file=@sample.pdf" http://localhost:8000/api/convert --output sample.docx
```

## Stack

- FastAPI, PyMuPDF, python-docx, Pillow, pdfplumber
- OCR abstraction: Tesseract/PaddleOCR (optional, scanned pages warn if missing)

## Next.js integration

Set `NEXT_PUBLIC_CONVERTER_API_URL=http://localhost:8000` in `.env.local` for dev,
or `https://your-backend.onrender.com` in production. The frontend at
`/tools/pdf-docx-converter` calls this backend for PDF→DOCX; DOCX→PDF stays client-side
(jspdf) for now.

## Vercel

For Vercel deployment, the Next.js API route `src/app/api/convert/route.ts` proxies
to this backend (or deploy this FastAPI as a separate service on Render/Fly).

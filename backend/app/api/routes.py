import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import io

from app.core.config import settings
from app.services.converter import convert_pdf_to_docx

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@router.post("/convert")
async def convert(file: UploadFile = File(...)):
    # Validate
    if not file.filename:
        raise HTTPException(400, "No file provided")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(400, "Only .pdf files are accepted")
    if file.content_type and "pdf" not in file.content_type.lower() and file.content_type != "application/octet-stream":
        # Allow octet-stream for drag-drop
        pass

    data = await file.read()
    if len(data) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(413, f"File too large — max {settings.max_file_size_mb} MB")
    if len(data) < 5 or data[:5] != b"%PDF-":
        raise HTTPException(400, "Invalid PDF signature")

    try:
        docx_bytes, meta = convert_pdf_to_docx(data, file.filename)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Conversion failed: {e}")

    base = os.path.splitext(file.filename)[0] or "document"
    out_name = f"{base}.docx"
    headers = {
        "Content-Disposition": f'attachment; filename="{out_name}"',
        "X-Conversion-Warnings": "; ".join(meta.get("warnings", []))[:1000],
        "X-Conversion-Pages": str(meta.get("pages", "")),
        "X-Conversion-Status": meta.get("status", "completed"),
    }
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers,
    )

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    max_file_size_mb: int = 20
    allowed_extensions: set[str] = {".pdf"}
    # Storage
    storage_type: str = "local"  # local | s3 (s3 not implemented yet, falls back to local)
    local_storage_dir: str = "/tmp/pdf2docx"
    # OCR
    ocr_engine: str = "auto"  # auto | tesseract | paddle | none
    # CORS
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_prefix = ""


settings = Settings()

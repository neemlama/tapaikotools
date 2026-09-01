import uuid
from pathlib import Path

from app.core.config import settings
from app.storage.base import StorageBackend


class LocalStorage(StorageBackend):
    def __init__(self, base_dir: str | None = None):
        self.base = Path(base_dir or settings.local_storage_dir)
        self.base.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, filename: str) -> str:
        uid = uuid.uuid4().hex[:8]
        path = self.base / f"{uid}_{filename}"
        path.write_bytes(data)
        return str(path)

    def load(self, path: str) -> bytes:
        return Path(path).read_bytes()

    def delete(self, path: str) -> None:
        try:
            Path(path).unlink(missing_ok=True)
        except Exception:
            pass


storage = LocalStorage()

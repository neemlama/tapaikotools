from abc import ABC, abstractmethod
from pathlib import Path


class StorageBackend(ABC):
    @abstractmethod
    def save(self, data: bytes, filename: str) -> str:
        pass

    @abstractmethod
    def load(self, path: str) -> bytes:
        pass

    @abstractmethod
    def delete(self, path: str) -> None:
        pass

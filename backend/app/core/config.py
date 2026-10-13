"""
Application configuration for NEXORA STUDIO Backend.
Configured for secure localhost development without wildcard CORS or external database.
"""

from pathlib import Path
from pydantic import BaseModel
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    APP_NAME: str = "NEXORA STUDIO Engine"
    APP_VERSION: str = "2.1.0"
    API_PREFIX: str = "/api"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("BACKEND_PORT", 8000 if os.getenv("PORT") == "8080" else os.getenv("PORT", 8000)))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Secure localhost-only CORS (no wildcard '*')
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    # Safety limits
    MAX_UPLOAD_SIZE_BYTES: int = 500 * 1024 * 1024  # 500 MB
    MAX_CONCURRENT_JOBS: int = 2  # Intel Core i7-7500U (2 cores / 4 threads) friendly
    PROCESS_TIMEOUT_SECONDS: int = 300  # 5 minutes max per FFmpeg operation
    
    # Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    TEMP_STORAGE_DIR: Path = (
        Path(os.getenv("NEXORA_TEMP_DIR")).resolve()
        if os.getenv("NEXORA_TEMP_DIR")
        else Path(tempfile.gettempdir()) / "nexora_studio"
    )
    
    # Allowed extensions
    ALLOWED_VIDEO_EXTENSIONS: set[str] = {".mp4", ".webm", ".mov", ".mkv", ".avi", ".m4v"}
    ALLOWED_AUDIO_EXTENSIONS: set[str] = {".mp3", ".wav", ".aac", ".ogg", ".m4a", ".flac"}
    ALLOWED_IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


settings = Settings()
settings.TEMP_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

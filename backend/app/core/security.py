"""
Security and validation utilities for file uploads and subprocess execution.
"""

import re
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile
from backend.app.core.config import settings


def sanitize_filename(filename: str) -> str:
    """
    Sanitize uploaded filename to prevent directory traversal and special character injection.
    """
    # Keep only alphanumeric, hyphen, underscore, and dot
    clean_name = Path(filename).name
    clean_name = re.sub(r"[^\w\s\.-]", "", clean_name).strip()
    clean_name = re.sub(r"[\s]+", "_", clean_name)
    if not clean_name:
        clean_name = f"media_{uuid.uuid4().hex[:8]}"
    return clean_name


def validate_file_extension(filename: str, allowed_extensions: set[str]) -> str:
    """
    Verify that the file has a permitted extension.
    """
    ext = Path(filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {sorted(list(allowed_extensions))}"
        )
    return ext


def generate_safe_temp_path(prefix: str, extension: str) -> Path:
    """
    Generate a unique, collision-free, safe path inside the configured temporary workspace.
    """
    safe_ext = extension if extension.startswith(".") else f".{extension}"
    unique_name = f"{prefix}_{uuid.uuid4().hex}{safe_ext}"
    target_path = settings.TEMP_STORAGE_DIR / unique_name
    
    # Ensure path is strictly inside temp dir
    if not target_path.resolve().is_relative_to(settings.TEMP_STORAGE_DIR.resolve()):
        raise HTTPException(status_code=400, detail="Invalid target file path")
        
    return target_path


async def save_upload_safely(file: UploadFile, allowed_extensions: set[str]) -> Path:
    """
    Save an uploaded file safely with streaming size checks.
    """
    filename = file.filename or "uploaded_media"
    ext = validate_file_extension(filename, allowed_extensions)
    target_path = generate_safe_temp_path("upload", ext)
    
    total_bytes = 0
    with open(target_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):  # 1 MB chunks
            total_bytes += len(chunk)
            if total_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
                out_file.close()
                if target_path.exists():
                    target_path.unlink()
                raise HTTPException(
                    status_code=413,
                    detail=f"Uploaded file exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB."
                )
            out_file.write(chunk)
            
    return target_path

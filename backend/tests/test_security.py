import pytest
from fastapi import HTTPException
from backend.app.core.security import (
    sanitize_filename,
    validate_file_extension,
    generate_safe_temp_path,
)
from backend.app.core.config import settings


def test_sanitize_filename():
    assert sanitize_filename("../../etc/passwd.mp4") == "passwd.mp4"
    assert sanitize_filename("my video clip (4K)!.mp4") == "my_video_clip_4K.mp4"
    assert sanitize_filename("   ") != ""
    assert sanitize_filename("normal_file.mov") == "normal_file.mov"


def test_validate_file_extension():
    allowed = {".mp4", ".mov", ".webm"}
    assert validate_file_extension("video.mp4", allowed) == ".mp4"
    assert validate_file_extension("VIDEO.MOV", allowed) == ".mov"

    with pytest.raises(HTTPException) as exc:
        validate_file_extension("malicious.exe", allowed)
    assert exc.value.status_code == 400


def test_generate_safe_temp_path():
    path = generate_safe_temp_path("test", ".mp4")
    assert path.suffix == ".mp4"
    assert path.resolve().is_relative_to(settings.TEMP_STORAGE_DIR.resolve())

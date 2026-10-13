import subprocess
import pytest
from pathlib import Path
from backend.app.core.config import settings


@pytest.fixture(scope="module")
def sample_video_file():
    """Generates a tiny 1-second synthetic MP4 video using ffmpeg for testing."""
    test_file = settings.TEMP_STORAGE_DIR / "test_synthetic.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=1",
        "-c:v", "libx264", "-c:a", "aac",
        str(test_file)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    yield test_file
    if test_file.exists():
        test_file.unlink()


def test_media_metadata_valid(client, sample_video_file):
    """Test POST /api/media/metadata with a valid video."""
    with open(sample_video_file, "rb") as f:
        response = client.post(
            "/api/media/metadata",
            files={"file": ("test_synthetic.mp4", f, "video/mp4")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["has_video"] is True
    assert data["width"] == 320
    assert data["height"] == 240
    assert data["duration"] >= 0.9


def test_media_metadata_invalid_extension(client):
    """Test POST /api/media/metadata rejects unauthorized file extensions."""
    response = client.post(
        "/api/media/metadata",
        files={"file": ("virus.exe", b"binary content", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_generate_thumbnail(client, sample_video_file):
    """Test POST /api/media/thumbnail creates a JPEG response."""
    with open(sample_video_file, "rb") as f:
        response = client.post(
            "/api/media/thumbnail",
            files={"file": ("test_synthetic.mp4", f, "video/mp4")},
            data={"timestamp": 0.5}
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert len(response.content) > 100


def test_extract_audio(client, sample_video_file):
    """Test POST /api/media/extract-audio creates an MP3 response."""
    with open(sample_video_file, "rb") as f:
        response = client.post(
            "/api/media/extract-audio",
            files={"file": ("test_synthetic.mp4", f, "video/mp4")},
            data={"audio_format": "mp3"}
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert len(response.content) > 50


def test_resize_video(client, sample_video_file):
    """Test POST /api/media/resize returns resized MP4."""
    with open(sample_video_file, "rb") as f:
        response = client.post(
            "/api/media/resize",
            files={"file": ("test_synthetic.mp4", f, "video/mp4")},
            data={"resolution": "720p"}
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "video/mp4"
    assert len(response.content) > 100

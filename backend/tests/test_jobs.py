import time
import subprocess
import pytest
from backend.app.core.config import settings


@pytest.fixture(scope="module")
def job_sample_video():
    """Generates a 0.5-second synthetic MP4 for fast job testing."""
    test_file = settings.TEMP_STORAGE_DIR / "job_test_sample.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=0.5:size=160x120:rate=15",
        "-c:v", "libx264",
        str(test_file)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    yield test_file
    if test_file.exists():
        test_file.unlink()


def test_export_job_lifecycle(client, job_sample_video):
    """Test full lifecycle: create job -> check progress -> await completion -> download."""
    with open(job_sample_video, "rb") as f:
        response = client.post(
            "/api/jobs/export",
            files={"file": ("job_test_sample.mp4", f, "video/mp4")},
            data={"resolution": "720p", "fps": 24, "bitrate": "standard"}
        )
    assert response.status_code == 200
    job_data = response.json()
    job_id = job_data["job_id"]
    assert job_id.startswith("job_")

    # Poll status until finished or timeout
    max_wait = 15
    start = time.time()
    final_status = "queued"

    while time.time() - start < max_wait:
        status_resp = client.get(f"/api/jobs/{job_id}")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        final_status = status_data["status"]
        if final_status in ("completed", "failed"):
            break
        time.sleep(0.5)

    assert final_status == "completed"

    # Download output
    download_resp = client.get(f"/api/jobs/{job_id}/download")
    assert download_resp.status_code == 200
    assert download_resp.headers["content-type"] == "video/mp4"
    assert len(download_resp.content) > 100


def test_cancel_export_job(client, job_sample_video):
    """Test cancelling an active export job."""
    with open(job_sample_video, "rb") as f:
        response = client.post(
            "/api/jobs/export",
            files={"file": ("job_test_sample.mp4", f, "video/mp4")},
            data={"resolution": "1080p", "fps": 30}
        )
    job_id = response.json()["job_id"]

    cancel_resp = client.post(f"/api/jobs/{job_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"


def test_nonexistent_job_returns_404(client):
    """Querying invalid job ID returns 404."""
    response = client.get("/api/jobs/job_invalid_999999")
    assert response.status_code == 404

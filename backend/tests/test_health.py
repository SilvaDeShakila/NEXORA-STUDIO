def test_health_check_endpoint(client):
    """Verify GET /api/health returns 200, system health, and tool flags."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "ffmpeg_available" in data
    assert "ffprobe_available" in data
    assert "quicksync_hardware_accel" in data
    assert data["database"] == "none (stateless in-memory job engine)"


def test_root_endpoint(client):
    """Verify root GET / returns service information and docs URLs."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["docs"] == "/docs"

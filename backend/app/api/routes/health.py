"""
Health check and system diagnostics endpoint.
"""

from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.services.ffmpeg_service import check_tool_installed, detect_quicksync_support

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def get_system_health():
    """
    Returns API status, version, and host media engine availability.
    """
    ffmpeg_ok = check_tool_installed("ffmpeg")
    ffprobe_ok = check_tool_installed("ffprobe")
    quicksync_ok = detect_quicksync_support()

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ffmpeg_available": ffmpeg_ok,
        "ffprobe_available": ffprobe_ok,
        "quicksync_hardware_accel": quicksync_ok,
        "recommended_encoder": "h264_qsv" if quicksync_ok else "libx264",
        "database": "none (stateless in-memory job engine)",
        "hardware_target": "Intel Core i7-7500U / Intel HD Graphics 620"
    }

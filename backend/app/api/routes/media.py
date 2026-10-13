"""
Media processing endpoints: Metadata, Thumbnails, Conversion, Resizing, and Audio Extraction.
"""

from pathlib import Path
from fastapi import APIRouter, File, Form, UploadFile, BackgroundTasks
from fastapi.responses import FileResponse
from backend.app.core.config import settings
from backend.app.core.security import save_upload_safely, generate_safe_temp_path
from backend.app.services.ffmpeg_service import (
    extract_media_metadata,
    generate_video_thumbnail,
    convert_video_format,
    resize_video_resolution,
    extract_media_audio,
)

router = APIRouter(prefix="/media", tags=["Media Processing"])


def cleanup_temp_files(*paths: Path):
    """Safely unlink temporary files after response completion."""
    for p in paths:
        try:
            if p and p.exists():
                p.unlink()
        except Exception:
            pass


@router.post("/metadata")
async def get_media_metadata_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Extract stream metadata from uploaded video or audio using ffprobe.
    """
    allowed = settings.ALLOWED_VIDEO_EXTENSIONS | settings.ALLOWED_AUDIO_EXTENSIONS
    input_path = await save_upload_safely(file, allowed)
    background_tasks.add_task(cleanup_temp_files, input_path)

    metadata = extract_media_metadata(input_path)
    return metadata


@router.post("/thumbnail")
async def generate_thumbnail_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    timestamp: float = Form(1.0)
):
    """
    Generate an actual JPEG thumbnail from an uploaded video file.
    """
    input_path = await save_upload_safely(file, settings.ALLOWED_VIDEO_EXTENSIONS)
    output_path = generate_safe_temp_path("thumb", ".jpg")
    background_tasks.add_task(cleanup_temp_files, input_path, output_path)

    generate_video_thumbnail(input_path, output_path, timestamp)
    return FileResponse(
        path=output_path,
        media_type="image/jpeg",
        filename=f"thumb_{file.filename}.jpg"
    )


@router.post("/convert")
async def convert_video_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form("mp4"),
    codec: str = Form("libx264")
):
    """
    Convert video format to MP4 or WebM using FFmpeg.
    """
    input_path = await save_upload_safely(file, settings.ALLOWED_VIDEO_EXTENSIONS)
    target_ext = f".{target_format.lower()}"
    output_path = generate_safe_temp_path("converted", target_ext)
    background_tasks.add_task(cleanup_temp_files, input_path, output_path)

    convert_video_format(input_path, output_path, codec)
    return FileResponse(
        path=output_path,
        media_type=f"video/{target_format.lower()}",
        filename=f"converted_{Path(file.filename or 'video').stem}{target_ext}"
    )


@router.post("/resize")
async def resize_video_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    resolution: str = Form("1080p")
):
    """
    Resize video to 720p, 1080p, 1440p, or 4K UHD with proper aspect ratio padding.
    """
    input_path = await save_upload_safely(file, settings.ALLOWED_VIDEO_EXTENSIONS)
    output_path = generate_safe_temp_path(f"resize_{resolution}", ".mp4")
    background_tasks.add_task(cleanup_temp_files, input_path, output_path)

    resize_video_resolution(input_path, output_path, resolution)
    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"resized_{resolution}_{Path(file.filename or 'video').stem}.mp4"
    )


@router.post("/extract-audio")
async def extract_audio_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    audio_format: str = Form("mp3")
):
    """
    Extract audio track from an uploaded video file to MP3 or WAV.
    """
    input_path = await save_upload_safely(file, settings.ALLOWED_VIDEO_EXTENSIONS)
    target_ext = f".{audio_format.lower()}"
    output_path = generate_safe_temp_path("audio", target_ext)
    background_tasks.add_task(cleanup_temp_files, input_path, output_path)

    extract_media_audio(input_path, output_path, audio_format)
    mime = "audio/mpeg" if audio_format.lower() == "mp3" else "audio/wav"
    return FileResponse(
        path=output_path,
        media_type=mime,
        filename=f"extracted_{Path(file.filename or 'media').stem}{target_ext}"
    )

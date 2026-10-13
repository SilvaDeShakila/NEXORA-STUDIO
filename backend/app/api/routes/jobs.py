"""
Export Jobs API endpoints: Create, Monitor, Cancel, and Download jobs.
Uses asynchronous thread executor without database persistence.
"""

import asyncio
from pathlib import Path
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse
from backend.app.core.config import settings
from backend.app.core.security import save_upload_safely
from backend.app.services.job_service import job_manager

router = APIRouter(prefix="/jobs", tags=["Export Jobs"])


@router.post("/export")
async def create_export_job_endpoint(
    file: UploadFile = File(...),
    resolution: str = Form("1080p"),
    fps: int = Form(30),
    bitrate: str = Form("high")
):
    """
    Queue an asynchronous video export rendering job.
    """
    input_path = await save_upload_safely(file, settings.ALLOWED_VIDEO_EXTENSIONS)
    output_filename = f"export_{resolution}_{fps}fps_{Path(file.filename or 'video').stem}.mp4"

    job = await job_manager.create_job("video_export", output_filename)

    res_map = {
        "720p": "1280:720",
        "1080p": "1920:1080",
        "1440p": "2560:1440",
        "4k": "3840:2160",
        "4K": "3840:2160",
    }
    target_scale = res_map.get(resolution.lower(), "1920:1080")
    b_rate = "30M" if bitrate == "ultra" else "16M" if bitrate == "high" else "8M"

    ffmpeg_args = [
        "-i", str(input_path),
        "-vf", f"scale={target_scale}:force_original_aspect_ratio=decrease,pad={target_scale}:(ow-iw)/2:(oh-ih)/2",
        "-r", str(fps),
        "-c:v", "libx264",
        "-preset", "fast",
        "-b:v", b_rate,
        "-c:a", "aac",
        "-b:a", "256k",
        str(job.output_path)
    ]

    # Spawn background task
    task = asyncio.create_task(job_manager.execute_export(job.job_id, ffmpeg_args))
    job.task = task

    return {
        "job_id": job.job_id,
        "status": job.status,
        "progress": job.progress,
        "resolution": resolution,
        "output_filename": job.output_filename
    }


@router.get("/{job_id}")
def get_job_status_endpoint(job_id: str):
    """
    Query current status and percentage progress of an export job.
    """
    job = job_manager.get_job(job_id)
    return {
        "job_id": job.job_id,
        "job_type": job.job_type,
        "status": job.status,
        "progress": job.progress,
        "created_at": job.created_at,
        "output_filename": job.output_filename,
        "error_message": job.error_message
    }


@router.post("/{job_id}/cancel")
async def cancel_job_endpoint(job_id: str):
    """
    Cancel an in-progress export job and purge temporary files.
    """
    job = await job_manager.cancel_job(job_id)
    return {
        "job_id": job.job_id,
        "status": job.status,
        "message": "Job cancelled successfully."
    }


@router.get("/{job_id}/download")
def download_job_output_endpoint(job_id: str):
    """
    Download the rendered video file once the job status is 'completed'.
    """
    job = job_manager.get_job(job_id)
    if job.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed yet (current status: {job.status})."
        )
    if not job.output_path or not job.output_path.exists():
        raise HTTPException(status_code=404, detail="Rendered output file was not found.")

    return FileResponse(
        path=job.output_path,
        media_type="video/mp4",
        filename=job.output_filename
    )

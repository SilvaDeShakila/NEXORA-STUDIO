"""
In-memory Export Job Manager.
Zero database dependencies. Uses safe temporary local filesystem paths.
"""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional
from fastapi import HTTPException
from backend.app.core.config import settings
from backend.app.services.ffmpeg_service import run_ffmpeg_command


@dataclass
class ExportJob:
    job_id: str
    job_type: str
    status: str  # queued, processing, completed, failed, cancelled
    progress: int  # 0 to 100
    created_at: float
    output_path: Optional[Path] = None
    output_filename: Optional[str] = None
    error_message: Optional[str] = None
    task: Optional[asyncio.Task] = None


class JobManager:
    def __init__(self):
        self._jobs: Dict[str, ExportJob] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, job_type: str, output_filename: str) -> ExportJob:
        async with self._lock:
            # Check concurrency limit
            active_jobs = [j for j in self._jobs.values() if j.status in ("queued", "processing")]
            if len(active_jobs) >= settings.MAX_CONCURRENT_JOBS:
                raise HTTPException(
                    status_code=429,
                    detail=f"Server is busy processing {len(active_jobs)} concurrent jobs. Please wait for an active job to finish."
                )

            job_id = f"job_{uuid.uuid4().hex[:12]}"
            output_path = settings.TEMP_STORAGE_DIR / f"{job_id}_{output_filename}"

            job = ExportJob(
                job_id=job_id,
                job_type=job_type,
                status="queued",
                progress=0,
                created_at=time.time(),
                output_path=output_path,
                output_filename=output_filename
            )
            self._jobs[job_id] = job
            self._cleanup_old_jobs()
            return job

    def get_job(self, job_id: str) -> ExportJob:
        job = self._jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Export job '{job_id}' not found.")
        return job

    async def cancel_job(self, job_id: str) -> ExportJob:
        job = self.get_job(job_id)
        if job.status in ("completed", "failed", "cancelled"):
            return job

        job.status = "cancelled"
        job.progress = 0
        if job.task and not job.task.done():
            job.task.cancel()

        if job.output_path and job.output_path.exists():
            try:
                job.output_path.unlink()
            except Exception:
                pass
        return job

    async def execute_export(self, job_id: str, ffmpeg_args: list[str]) -> None:
        """Run an export job in the background and update progress."""
        job = self.get_job(job_id)
        job.status = "processing"
        job.progress = 10

        try:
            # Simulated progress increments during processing
            for p in range(20, 85, 15):
                await asyncio.sleep(0.4)
                if job.status == "cancelled":
                    return
                job.progress = p

            # Run FFmpeg command in thread pool to avoid blocking asyncio loop
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None,
                run_ffmpeg_command,
                ffmpeg_args,
                settings.PROCESS_TIMEOUT_SECONDS
            )

            if job.status != "cancelled":
                job.progress = 100
                job.status = "completed"
        except asyncio.CancelledError:
            job.status = "cancelled"
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.progress = 0

    def _cleanup_old_jobs(self, max_age_seconds: int = 7200) -> None:
        """Clean up finished jobs older than 2 hours."""
        now = time.time()
        expired_ids = [
            jid for jid, j in self._jobs.items()
            if j.status in ("completed", "failed", "cancelled") and (now - j.created_at) > max_age_seconds
        ]
        for jid in expired_ids:
            job = self._jobs.pop(jid, None)
            if job and job.output_path and job.output_path.exists():
                try:
                    job.output_path.unlink()
                except Exception:
                    pass


job_manager = JobManager()

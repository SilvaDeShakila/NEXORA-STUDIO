"""
Service wrapper for FFmpeg and FFprobe subprocess execution.
Includes input validation, process timeouts, and QuickSync detection.
"""

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict
from fastapi import HTTPException
from backend.app.core.config import settings


def check_tool_installed(tool_name: str) -> bool:
    """Check if an executable is found in PATH."""
    return shutil.which(tool_name) is not None


def detect_quicksync_support() -> bool:
    """Check if Intel QuickSync encoder (h264_qsv) is available."""
    if not check_tool_installed("ffmpeg"):
        return False
    try:
        res = subprocess.run(
            ["ffmpeg", "-encoders"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5
        )
        return "h264_qsv" in res.stdout
    except Exception:
        return False


def run_ffmpeg_command(args: list[str], timeout: int = settings.PROCESS_TIMEOUT_SECONDS) -> None:
    """Run an FFmpeg command securely with timeouts and error handling."""
    if not check_tool_installed("ffmpeg"):
        raise HTTPException(status_code=503, detail="FFmpeg is not installed on the host system.")
        
    full_cmd = ["ffmpeg", "-y"] + args
    try:
        result = subprocess.run(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout
        )
        if result.returncode != 0:
            error_msg = result.stderr[-500:] if result.stderr else "Unknown FFmpeg error"
            raise HTTPException(status_code=500, detail=f"FFmpeg processing failed: {error_msg.strip()}")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail=f"FFmpeg processing timed out after {timeout} seconds.")


def extract_media_metadata(file_path: Path) -> Dict[str, Any]:
    """Extract media stream metadata using ffprobe."""
    if not check_tool_installed("ffprobe"):
        raise HTTPException(status_code=503, detail="FFprobe is not installed on the host system.")
        
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(file_path)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=15
        )
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail="Unable to probe media file format.")
            
        data = json.loads(result.stdout)
        format_info = data.get("format", {})
        streams = data.get("streams", [])
        
        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
        
        # Calculate frame rate
        fps = 0.0
        if video_stream and "r_frame_rate" in video_stream:
            r_rate = video_stream["r_frame_rate"]
            if "/" in r_rate:
                num, den = r_rate.split("/")
                fps = round(float(num) / float(den), 2) if float(den) != 0 else 0.0
            else:
                fps = float(r_rate)
                
        duration = float(format_info.get("duration", 0.0))
        if duration == 0.0 and video_stream:
            duration = float(video_stream.get("duration", 0.0))
            
        return {
            "filename": file_path.name,
            "duration": round(duration, 3),
            "size_bytes": int(format_info.get("size", file_path.stat().st_size if file_path.exists() else 0)),
            "bitrate": int(format_info.get("bit_rate", 0)),
            "format_name": format_info.get("format_name", ""),
            "has_video": video_stream is not None,
            "has_audio": audio_stream is not None,
            "width": int(video_stream.get("width", 0)) if video_stream else 0,
            "height": int(video_stream.get("height", 0)) if video_stream else 0,
            "video_codec": video_stream.get("codec_name", "") if video_stream else None,
            "audio_codec": audio_stream.get("codec_name", "") if audio_stream else None,
            "frame_rate": fps,
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="FFprobe metadata extraction timed out.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Corrupted metadata output from FFprobe.")


def generate_video_thumbnail(video_path: Path, output_path: Path, timestamp: float = 1.0) -> Path:
    """Generate a JPEG thumbnail from a video file at the given timestamp."""
    args = [
        "-ss", str(max(0.0, timestamp)),
        "-i", str(video_path),
        "-vframes", "1",
        "-q:v", "2",
        str(output_path)
    ]
    run_ffmpeg_command(args, timeout=20)
    if not output_path.exists():
        raise HTTPException(status_code=500, detail="Thumbnail was not generated.")
    return output_path


def convert_video_format(input_path: Path, output_path: Path, video_codec: str = "libx264") -> Path:
    """Transcode a video to MP4 or WebM."""
    args = [
        "-i", str(input_path),
        "-c:v", video_codec,
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(output_path)
    ]
    run_ffmpeg_command(args)
    return output_path


def resize_video_resolution(input_path: Path, output_path: Path, resolution: str) -> Path:
    """Resize video maintaining aspect ratio with letterboxing if necessary."""
    res_map = {
        "720p": "1280:720",
        "1080p": "1920:1080",
        "1440p": "2560:1440",
        "4k": "3840:2160",
        "4K": "3840:2160",
    }
    target_scale = res_map.get(resolution.lower(), "1920:1080")
    
    scale_filter = f"scale={target_scale}:force_original_aspect_ratio=decrease,pad={target_scale}:(ow-iw)/2:(oh-ih)/2"
    args = [
        "-i", str(input_path),
        "-vf", scale_filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "aac",
        str(output_path)
    ]
    run_ffmpeg_command(args)
    return output_path


def extract_media_audio(input_path: Path, output_path: Path, audio_format: str = "mp3") -> Path:
    """Extract audio stream from a video into an MP3 or WAV file."""
    codec = "libmp3lame" if audio_format.lower() == "mp3" else "pcm_s16le" if audio_format.lower() == "wav" else "aac"
    args = [
        "-i", str(input_path),
        "-vn",
        "-c:a", codec,
        "-b:a", "256k",
        str(output_path)
    ]
    run_ffmpeg_command(args)
    return output_path

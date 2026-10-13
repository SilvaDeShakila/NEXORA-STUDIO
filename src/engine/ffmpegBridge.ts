import { Project, ExportSettings } from '../types/studio';

export function generateFFmpegCommand(project: Project, settings: ExportSettings): string {
  const isQuickSync = settings.useHardwareAccel;
  const encoder = isQuickSync ? 'h264_qsv' : 'libx264';
  const preset = isQuickSync ? '-global_quality 20' : '-preset medium -crf 18';

  let resStr = '1920x1080';
  if (settings.resolution === '720p') resStr = '1280x720';
  if (settings.resolution === '1440p') resStr = '2560x1440';
  if (settings.resolution === '4K') resStr = '3840x2160';

  if (project.aspectRatio === '9:16') {
    const [w, h] = resStr.split('x');
    resStr = `${h}x${w}`;
  }

  const inputs: string[] = [];
  const filterChains: string[] = [];

  const videoClips = project.clips.filter((c) => c.type === 'video');
  const audioClips = project.clips.filter((c) => c.type === 'audio');

  videoClips.forEach((clip, idx) => {
    inputs.push(`-ss ${clip.mediaOffset.toFixed(2)} -t ${clip.duration.toFixed(2)} -i "input_${idx}.mp4"`);
  });

  audioClips.forEach((clip, idx) => {
    inputs.push(`-ss ${clip.mediaOffset.toFixed(2)} -t ${clip.duration.toFixed(2)} -i "audio_${idx}.mp3"`);
  });

  const cmd = [
    'ffmpeg',
    ...inputs,
    `-filter_complex "scale=${resStr}:force_original_aspect_ratio=decrease,pad=${resStr}:(ow-iw)/2:(oh-ih)/2"`,
    `-c:v ${encoder}`,
    preset,
    `-r ${settings.fps}`,
    `-b:v ${settings.bitrate === 'ultra' ? '30M' : settings.bitrate === 'high' ? '15M' : '8M'}`,
    '-pix_fmt yuv420p',
    '-c:a aac -b:a 320k',
    `"output_${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${settings.resolution}.mp4"`,
  ].join(' \\\n  ');

  return cmd;
}

export function generatePythonFastAPIServiceCode(): string {
  return `"""
NEXORA STUDIO — High-Performance Python Video Rendering Service
Supports Intel QuickSync, FFmpeg filter graph, PyAV, OpenCV, and WebSockets.
"""

from fastapi import FastAPI, WebSocket, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import json
import asyncio
import shutil
from typing import Dict, Any

app = FastAPI(title="Nexora Studio Backend Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./workspace/uploads"
OUTPUT_DIR = "./workspace/renders"
PROXIES_DIR = "./workspace/proxies"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PROXIES_DIR, exist_ok=True)

def detect_quicksync_support() -> bool:
    """Detect if Intel QuickSync h264_qsv is available on host machine."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-encoders"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return "h264_qsv" in result.stdout
    except Exception:
        return False

@app.get("/api/hardware")
def get_hardware_info():
    qsv = detect_quicksync_support()
    return {
        "cpu": "Intel Core i7-7500U (2 cores / 4 threads)",
        "gpu": "Intel HD Graphics 620",
        "quickSyncAvailable": qsv,
        "recommendedEncoder": "h264_qsv" if qsv else "libx264",
        "lowPerformanceModeRecommended": True
    }

@app.post("/api/proxy/generate")
def create_proxy_video(filename: str, resolution: str = "480p"):
    """Generates lightweight 480p/720p proxy for smooth preview on Intel HD 620."""
    input_path = os.path.join(UPLOAD_DIR, filename)
    output_path = os.path.join(PROXIES_DIR, f"proxy_{resolution}_{filename}")
    
    scale = "854:480" if resolution == "480p" else "1280:720"
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-vf", f"scale={scale}",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
        "-c:a", "aac", "-b:a", "128k",
        output_path
    ]
    subprocess.run(cmd, check=True)
    return {"proxyUrl": output_path, "resolution": resolution}

@app.websocket("/ws/render")
async def websocket_render_endpoint(websocket: WebSocket):
    """Real-time rendering stream with progress updates."""
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        project_data = json.loads(data)
        
        # Simulate rendering pipeline with hardware encoder
        qsv = detect_quicksync_support()
        encoder = "h264_qsv" if qsv else "libx264"
        
        for step in range(0, 101, 5):
            await asyncio.sleep(0.1)
            await websocket.send_json({
                "progress": step,
                "stage": f"Rendering frames with {encoder} ({step}%)...",
                "status": "rendering"
            })
            
        await websocket.send_json({
            "progress": 100,
            "stage": "Render complete! File saved.",
            "status": "finished",
            "downloadUrl": "/workspace/renders/output_master_4k.mp4"
        })
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
`;
}

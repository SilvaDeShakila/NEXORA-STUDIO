<div align="center">

# 🎬 NEXORA STUDIO

### The Ultimate Free AI Video & Photo Editing Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-4.4+-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen?style=for-the-badge)](https://github.com/)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)

<p align="center">
  A modern, professional, cross-platform video and photo editing application inspired by CapCut, DaVinci Resolve, and motion graphics suites.
  <br />
  <strong>Zero watermarks • Zero subscriptions • 100% Free & Open Source • True 4K UHD Export</strong>
</p>

</div>

---

## 🌟 Key Features

### 🎬 Professional Multi-Track Video Editor
- **Multi-Track Composition**: Master video, overlays / Picture-in-Picture, kinetic typography, master music, and SFX/voiceover tracks.
- **Precision Clip Editing**: Split clips directly at the playhead (`Ctrl+B`), dual-sided trim handles with source media offset tracking, clip duplication, and ripple movement.
- **Magnetic Snapping**: Automatically snaps clip boundaries to adjacent clips, playhead scrubbers, and audio beat markers.
- **Speed Ramping & Reverse**: Variable playback speed (`0.5x`, `1.0x`, `1.5x`, `2.0x`), frame-by-frame stepping, and instant reverse video.
- **Compositing & Green Screen**: Real-time canvas Chroma Key (color picker, tolerance, smoothness), opacity sliders, and blend modes (`Screen`, `Multiply`, `Overlay`, `Color-Dodge`).
- **Keyframe Animation Engine**: Position (`X/Y`), scale, rotation, and opacity keyframing with mathematical easing curves (`Linear`, `Ease-In`, `Ease-Out`, `Ease-In-Out`, `Bounce`, `Elastic`).

### ⚡ Hardware-Optimized Architecture
- **Optimized for Intel Core i7-7500U & Intel HD Graphics 620**:
  - **Dynamic Preview Proxy Quality**: Toggle between `360p`, `480p`, `720p`, and `Original` preview resolution for buttery-smooth 60 FPS timeline playback on integrated GPUs.
  - **Eco / Low-Performance Mode**: Bypasses heavy real-time CSS/WebGL filter passes in the preview viewport while guaranteeing full-resolution 4K final renders.
  - **Intel QuickSync & libx264 Support**: Runtime detection of `h264_qsv` hardware encoding with reliable CPU software fallbacks.
  - **Zero Database Overhead**: Stateless, in-memory job queues and browser `localStorage` project caching.

### 🎨 Visual Effects & Cinematic Transitions
- **Original Shaders**: Studio Glow, Neon Glow, RGB Color Split, Glitch, Camera Shake (beat-reactive), 35mm Film Grain, Vignette, Chromatic Aberration, and 90s VHS scanlines.
- **Dynamic Transitions**: Cross Fade, Dream Dissolve, Wipe Left/Right, Slide Left, Push Up, Fast Zoom In, Spin Warp, White Flash, and RGB Cyber Glitch.
- **Cinematic LUTs**: Hollywood Teal & Orange, Cyberpunk Magenta & Cyan, Kodak Vintage Warmth, Noir 4K Monochrome, and Moody Forest.

### 🎵 Web Audio Engine & Beat Synchronization
- **Spectral Transient Analysis**: Web Audio API FFT analyzer that computes energy flux and rhythmic transients.
- **Beat Markers & Auto-Cut**: Visual cyan beat markers placed along the timeline ruler with one-click **"Auto Cut to Beats"** and **"Auto Photo Slideshow to Beats"**.

### 📸 Professional Photo Studio
- **Dedicated Workspace**: Non-destructive cropping (`Freeform`, `1:1`, `4:5`, `9:16`, `16:9`, `Circle`), rotation (`90° CW/CCW`), and horizontal/vertical flips.
- **Adjustments**: Brightness, Contrast, Saturation, Blur, and Vignette.
- **AI Photo Enhancement**: One-click auto contrast equalization, edge sharpening, and background removal with PNG transparency download.

### 🤖 AI Creative Lab (Offline & CPU-Friendly)
- **AI Auto Captions**: Generates timestamped subtitle cues with kinetic animation presets and `.SRT` subtitle export.
- **AI Smart Cut**: Scans audio waveforms for dead silences and trims out awkward pauses.
- **AI Photo-to-Video Parallax**: Transforms static still images into 6-second Ken Burns 3D pan & zoom video sequences.

### 🚀 Dual Rendering Engine (Browser + FastAPI)
- **In-Browser Video Renderer**: Frame-by-frame canvas compositor capturing to WebM/MP4 with live frame thumbnails and zero watermarks.
- **Python FastAPI Processing Backend**: High-performance headless FFmpeg/FFprobe service for server-side transcoding, thumbnail generation, resizing, and background export jobs.

---

## 🏗️ System Architecture

```
                                  +------------------------------------+
                                  |           NEXORA STUDIO            |
                                  |     (React 19 + TypeScript)        |
                                  +-----------------+------------------+
                                                    |
                   +--------------------------------+--------------------------------+
                   |                                                                 |
                   v                                                                 v
+--------------------------------------+                          +--------------------------------------+
|       Client-Side Browser Engine     |                          |      Python FastAPI Microservice     |
|   (Canvas 2D / Web Audio API / DOM)  |                          |         (Uvicorn + FFmpeg)           |
+--------------------------------------+                          +--------------------------------------+
| • Multi-track Canvas Compositing     |                          | • GET  /api/health                   |
| • Keyframe Interpolation & Shaders   |  HTTP REST / Multipart   | • POST /api/media/metadata (FFprobe) |
| • Real-time Web Audio Beat Analysis  | <======================> | • POST /api/media/thumbnail (FFmpeg) |
| • Client-side MediaRecorder Export   |  (Auto-detection with    | • POST /api/media/convert (Transcode)|
| • Browser localStorage Persistence   |   Graceful Fallback)     | • POST /api/media/resize (4K/1080p)  |
+--------------------------------------+                          | • POST /api/jobs/export (Async Queue)|
                                                                  +--------------------------------------+
```

---

## 📂 Repository Structure

```
NEXORA-STUDIO/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py        # System diagnostics and tool check
│   │   │       ├── media.py         # Metadata, thumbnails, resizing, audio extraction
│   │   │       └── jobs.py          # Asynchronous export job queue
│   │   ├── core/
│   │   │   ├── config.py            # App settings and hardware safety limits
│   │   │   └── security.py          # Filename sanitization and upload validation
│   │   ├── services/
│   │   │   ├── ffmpeg_service.py    # FFmpeg/FFprobe subprocess wrappers
│   │   │   └── job_service.py       # In-memory thread-safe export manager
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/
│   │   ├── conftest.py              # TestClient fixtures
│   │   ├── test_health.py           # Health and root endpoint tests
│   │   ├── test_media.py            # FFprobe metadata and thumbnail tests
│   │   ├── test_jobs.py             # Export lifecycle and cancellation tests
│   │   └── test_security.py         # Path traversal and sanitization tests
│   └── requirements.txt             # Python dependencies
├── src/
│   ├── components/
│   │   ├── layout/StudioHeader.tsx  # Header with live backend status indicator
│   │   ├── preview/PreviewPlayer.tsx# Canvas compositing viewport & transport
│   │   ├── timeline/                # Multi-track timeline & clip operations
│   │   ├── inspector/               # Transform, color grading, keyframe inspector
│   │   ├── sidebar/LeftSidebar.tsx  # Media pool, audio, text, transitions, effects
│   │   ├── photo/                   # Dedicated Photo Studio workspace
│   │   ├── templates/               # Creator video templates
│   │   ├── ai/                      # AI Creative Lab workspace
│   │   ├── export/ExportModal.tsx   # Video export dialogue (WebM/MP4/FFmpeg)
│   │   └── desktop/                 # Desktop & Python service diagnostics modal
│   ├── engine/                      # Browser rendering, audio FFT, FFmpeg bridges
│   ├── services/apiService.ts       # Typed frontend API client with auto-fallback
│   ├── store/studioStore.ts         # Zustand application state
│   ├── types/studio.ts              # Core TypeScript interfaces
│   ├── App.tsx                      # Root component
│   └── main.tsx                     # React DOM entry point
├── .github/
│   └── workflows/ci.yml             # GitHub Actions CI for Node.js and Python
├── .env.example                     # Safe environment template
├── .gitignore                       # Repository exclusions
├── package.json                     # Frontend dependencies and build scripts
├── README.md                        # Project documentation
└── LICENSE.md                       # Open source license notice
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (or [Bun](https://bun.sh/))
- **Python**: v3.11 or higher
- **FFmpeg & FFprobe**: Installed and available on your system `PATH`
  - **Ubuntu/Debian**: `sudo apt update && sudo apt install -y ffmpeg`
  - **macOS**: `brew install ffmpeg`
  - **Windows**: `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org/)

---

### 1. Frontend Setup (React Studio)

```bash
# Clone the repository
git clone https://github.com/your-username/nexora-studio.git
cd nexora-studio

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start at **`http://localhost:3000`** (or Vite's assigned port).

---

### 2. Backend Setup (Python FastAPI)

The backend can be run in parallel with the frontend to enable server-side FFmpeg processing:

```bash
# Create and activate a Python virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server (localhost-only)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will start at **`http://127.0.0.1:8000`** (or **`http://localhost:8000`**).

---

## 📖 API Documentation

Once the Python backend is running, explore the interactive API documentation:

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check API health, FFmpeg availability, and QuickSync hardware status. |
| `POST` | `/api/media/metadata` | Extract video/audio stream metadata (codecs, FPS, resolution) using FFprobe. |
| `POST` | `/api/media/thumbnail` | Generate an exact frame JPEG thumbnail from an uploaded video file. |
| `POST` | `/api/media/convert` | Transcode media to MP4 or WebM with specified video codecs. |
| `POST` | `/api/media/resize` | Resize video to 720p, 1080p, 1440p, or 4K with aspect ratio preservation. |
| `POST` | `/api/media/extract-audio`| Extract audio stream from a video into MP3 or WAV format. |
| `POST` | `/api/jobs/export` | Queue an asynchronous background video rendering job. |
| `GET` | `/api/jobs/{job_id}` | Poll export job status, percentage progress, and errors. |
| `POST` | `/api/jobs/{job_id}/cancel` | Cancel an in-progress export job and clean up temporary files. |
| `GET` | `/api/jobs/{job_id}/download` | Download the rendered master video file once completed. |

---

## 🧪 Running Tests

### Backend Unit Tests (Pytest)
```bash
python -m pytest backend/tests/ -v
```

### Frontend Typechecking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## 🗺️ Project Roadmap

- [x] Multi-track video timeline with splitting, trimming, and dragging.
- [x] Real-time Canvas 2D compositing and keyframe animation.
- [x] Web Audio API FFT beat detection and rhythm snapping.
- [x] Dedicated Photo Studio with unsharp mask and background cutout.
- [x] Full-resolution 4K video export via MediaRecorder.
- [x] Python FastAPI microservice with FFmpeg & FFprobe integration.
- [x] Dual-engine architecture with graceful browser-only fallback.
- [ ] Native Tauri v2 desktop shell for Windows, macOS, and Linux.
- [ ] Hardware-accelerated WebGPU compute shaders for 60 FPS real-time 4K previews.
- [ ] Local Whisper ONNX model integration for offline AI speech transcription.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Run tests to ensure everything passes (`pytest` and `npm run lint`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---

## 📄 License

This project is prepared for open-source distribution. Please refer to [LICENSE.md](LICENSE.md) for details on license selection and third-party dependency compatibility.

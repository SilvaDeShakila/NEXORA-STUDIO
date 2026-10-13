@echo off
REM NEXORA STUDIO — Start Local Python Backend (127.0.0.1:8000) for Windows
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

if exist ".venv\Scripts\activate.bat" (
    echo Activating Python virtual environment...
    call .venv\Scripts\activate.bat
)

set HOST=127.0.0.1
set PORT=8000

echo Starting NEXORA STUDIO Backend on http://127.0.0.1:8000 ...
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause

#!/usr/bin/env bash
# NEXORA STUDIO — Start Local Python Backend (127.0.0.1:8000)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check for virtual environment
if [ -d ".venv" ]; then
    echo "Activating virtual environment (.venv)..."
    source .venv/bin/activate
fi

export HOST="127.0.0.1"
export PORT="8000"

echo "Starting NEXORA STUDIO Backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

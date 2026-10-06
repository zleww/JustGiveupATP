"""
Local dev server: the FastAPI codex (api/index.py) + the static site, on one origin —
the same layout Vercel serves in production.

    pip install -r requirements.txt
    python scripts/dev_server.py            # http://localhost:8077
    python scripts/dev_server.py --port 9000
"""
import argparse
import sys
from pathlib import Path

import uvicorn
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))

from index import app  # noqa: E402  (L-Lawliet API, synced by scripts/sync_codex.py)

# Static files last, so /api/* and /health routes win
app.mount("/", StaticFiles(directory=ROOT, html=True), name="site")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8077)
    args = parser.parse_args()
    uvicorn.run(app, host="127.0.0.1", port=args.port)

#!/usr/bin/env bash
# Local preview — see the site exactly as it'll look live, before pushing.
# Usage:  ./preview.sh        (serves current folder at http://localhost:8000)
set -e
PORT="${1:-8000}"
echo "Previewing on http://localhost:$PORT  (branch: $(git rev-parse --abbrev-ref HEAD))"
echo "Press Ctrl+C to stop. Nothing is pushed live by running this."
# Open the browser, then serve.
( sleep 1; (command -v open >/dev/null && open "http://localhost:$PORT") || true ) &
python3 -m http.server "$PORT"

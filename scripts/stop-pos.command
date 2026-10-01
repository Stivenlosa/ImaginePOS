#!/bin/bash
# Double-click to stop the app DB container (and any npm start in this terminal session).
cd "$(dirname "$0")/.."
echo "Stopping database container..."
docker compose stop
echo "Done. Close any Terminal window that was running npm start (Ctrl+C)."
read -r -p "Press Enter to close..."

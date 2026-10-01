#!/bin/bash
# Double-click to stop local Postgres (Homebrew). Close the npm start Terminal with Ctrl+C.
cd "$(dirname "$0")/.."

echo "Stopping local Postgres..."
if command -v brew >/dev/null 2>&1; then
  if brew list postgresql@16 >/dev/null 2>&1; then
    brew services stop postgresql@16
  elif brew list postgresql@17 >/dev/null 2>&1; then
    brew services stop postgresql@17
  elif brew list postgresql >/dev/null 2>&1; then
    brew services stop postgresql
  else
    echo "No Homebrew Postgres service found."
  fi
elif command -v pg_ctl >/dev/null 2>&1 && [ -n "${PGDATA:-}" ]; then
  pg_ctl stop -m fast || true
else
  echo "Could not find a local Postgres service to stop."
fi

echo "Done. Close any Terminal window that was running npm start (Ctrl+C)."
read -r -p "Press Enter to close..."

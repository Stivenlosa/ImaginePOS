#!/bin/bash
# Double-click this file in Finder to start ImaginePOS with local Postgres (no Docker).
set -e
cd "$(dirname "$0")/.."

echo "Starting local Postgres..."
if command -v brew >/dev/null 2>&1; then
  if brew list postgresql@16 >/dev/null 2>&1; then
    brew services start postgresql@16
  elif brew list postgresql@17 >/dev/null 2>&1; then
    brew services start postgresql@17
  elif brew list postgresql >/dev/null 2>&1; then
    brew services start postgresql
  else
    echo "Postgres is not installed via Homebrew."
    echo "Install with: brew install postgresql@16"
    read -r -p "Press Enter to close..."
    exit 1
  fi
elif command -v pg_ctl >/dev/null 2>&1; then
  # Fallback if Postgres is installed another way and PGDATA is set
  if [ -z "${PGDATA:-}" ]; then
    echo "Found pg_ctl but PGDATA is not set. Start Postgres manually, then re-run."
    read -r -p "Press Enter to close..."
    exit 1
  fi
  pg_ctl status >/dev/null 2>&1 || pg_ctl start -l "$PGDATA/server.log"
else
  echo "Could not find Homebrew Postgres or pg_ctl."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo "Waiting for database..."
DB_URL="${DATABASE_URL:-postgresql://pos:change_me_strong@127.0.0.1:5432/imaginepos}"
if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a
  # Load .env safely for simple KEY=VALUE lines
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
      *) export "$line" 2>/dev/null || true ;;
    esac
  done < .env
  set +a
  DB_URL="${DATABASE_URL:-$DB_URL}"
fi

until psql "$DB_URL" -c 'SELECT 1' >/dev/null 2>&1; do
  sleep 1
done

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm ci
fi

if [ ! -d .next ]; then
  echo "Building app (first time)..."
  npm run build
fi

echo "Starting ImaginePOS..."
echo "Open on this PC:  http://localhost:3000"
echo "Other devices:    http://$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "STORE-PC-IP"):3000"
echo
npm start

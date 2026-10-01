#!/bin/bash
# Double-click this file in Finder to start ImaginePOS (DB + app).
set -e
cd "$(dirname "$0")/.."

echo "Starting database (Docker)..."
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Opening Docker Desktop..."
  open -a Docker
  echo "Waiting for Docker..."
  until docker info >/dev/null 2>&1; do sleep 2; done
fi

docker compose up -d

echo "Waiting for database..."
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-pos}" -d "${POSTGRES_DB:-imaginepos}" >/dev/null 2>&1; do
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

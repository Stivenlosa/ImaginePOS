@echo off
REM Double-click this file to start ImaginePOS (DB + app).
cd /d "%~dp0\.."

echo Starting database (Docker)...
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker is not running. Start Docker Desktop, then run this file again.
  pause
  exit /b 1
)

docker compose up -d
if errorlevel 1 (
  echo Failed to start database.
  pause
  exit /b 1
)

echo Waiting for database...
:waitdb
docker compose exec -T db pg_isready -U pos -d imaginepos >nul 2>&1
if errorlevel 1 (
  timeout /t 2 /nobreak >nul
  goto waitdb
)

if not exist node_modules (
  echo Installing dependencies...
  call npm ci
)

if not exist .next (
  echo Building app (first time)...
  call npm run build
)

echo Starting ImaginePOS...
echo Open on this PC:  http://localhost:3000
echo Other devices:    http://STORE-PC-LAN-IP:3000
echo.
call npm start
pause

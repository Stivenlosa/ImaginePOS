@echo off
REM Double-click to start ImaginePOS with local Windows Postgres (no Docker).
cd /d "%~dp0\.."

echo Starting local Postgres service...
net start postgresql-x64-16 >nul 2>&1
if errorlevel 1 net start postgresql-x64-17 >nul 2>&1
if errorlevel 1 net start postgresql-x64-15 >nul 2>&1
if errorlevel 1 (
  sc query type= service state= all | findstr /I "postgres" >nul
  if errorlevel 1 (
    echo Postgres Windows service not found.
    echo Install Postgres for Windows, or use scripts\start-pos.bat with Docker.
    pause
    exit /b 1
  )
  echo If Postgres is installed, start its service from Services.msc, then re-run.
  pause
  exit /b 1
)

echo Waiting for database...
:waitdb
psql "%DATABASE_URL%" -c "SELECT 1" >nul 2>&1
if errorlevel 1 (
  REM Fallback default URL if DATABASE_URL is not in this shell
  psql "postgresql://pos:change_me_strong@127.0.0.1:5432/imaginepos" -c "SELECT 1" >nul 2>&1
  if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto waitdb
  )
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

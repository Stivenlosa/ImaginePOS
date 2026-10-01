@echo off
REM Stop local Windows Postgres service. Close the npm start window with Ctrl+C.
cd /d "%~dp0\.."

echo Stopping local Postgres service...
net stop postgresql-x64-16 >nul 2>&1
if errorlevel 1 net stop postgresql-x64-17 >nul 2>&1
if errorlevel 1 net stop postgresql-x64-15 >nul 2>&1
if errorlevel 1 (
  echo Could not stop a known Postgres service. Check Services.msc for the exact name.
)

echo Done. Close the window that was running npm start (Ctrl+C).
pause

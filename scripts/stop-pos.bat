@echo off
cd /d "%~dp0\.."
echo Stopping database container...
docker compose stop
echo Done. Close the window that was running npm start (Ctrl+C).
pause

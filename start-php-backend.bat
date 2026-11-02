@echo off
echo ========================================================
echo   Starting Podar Pathways PHP Application Server (Port 5000)
echo   Frontend (React SPA) + Backend (PHP API)
echo   Open in browser: http://localhost:5000
echo ========================================================
cd /d "%~dp0"
node scripts/start-server.mjs


@echo off
echo ========================================================
echo   Starting Mobile Tunnel (Port Forwarding for Phone)
echo ========================================================
echo.
echo Make sure your server is running on port 5000 (npm start).
echo.
npx --yes localtunnel --port 5000
pause

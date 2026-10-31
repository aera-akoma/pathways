@echo off
echo ========================================================
echo   Starting Podar Pathways PHP Application Server (Port 5000)
echo   Frontend (React SPA) + Backend (PHP API)
echo   Open in browser: http://localhost:5000
echo ========================================================
set DB_DRIVER=sqlite
if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" -S 0.0.0.0:5000 router.php
) else (
    php -S 0.0.0.0:5000 router.php
)


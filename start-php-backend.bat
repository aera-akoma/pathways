@echo off
echo ========================================================
echo   Starting Podar Pathways PHP Backend (Port 5000)
echo ========================================================
set DB_DRIVER=sqlite
if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" -S localhost:5000 public\api\router.php
) else (
    php -S localhost:5000 public\api\router.php
)


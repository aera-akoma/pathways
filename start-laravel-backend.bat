@echo off
title Podar Pathways - Laravel 12 REST API Server
echo ============================================================
echo   Podar Pathways - Laravel 12 RESTful API Backend
echo   Framework: Laravel 12.72.0 | PHP ^8.2 (XAMPP) | Port: 8000
echo ============================================================
echo.

cd /d "%~dp0backend"
if exist "C:\xampp\php\php.exe" (
    echo Starting Laravel 12 Artisan API Server on http://127.0.0.1:8000 ...
    "C:\xampp\php\php.exe" artisan serve --port=8000
) else (
    echo [ERROR] PHP binary not found at C:\xampp\php\php.exe.
    echo Please install XAMPP or add PHP to your system PATH.
    pause
)

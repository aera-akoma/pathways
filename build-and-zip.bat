@echo off
echo ========================================================
echo   Podar Pathways - Build Production Bundle and ZIP
echo ========================================================
cd /d "%~dp0"
node scripts/build-zip.mjs
pause


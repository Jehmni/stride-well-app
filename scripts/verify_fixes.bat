@echo off
echo Verifying application fixes...

cd %~dp0\..
node scripts/verify_fixes.js

echo.
echo To apply fixes if needed, run run_manual_fix.bat
pause > nul

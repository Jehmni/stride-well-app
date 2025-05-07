
@echo off
echo Running database fixes for exercise logging and AI workout support...

cd %~dp0\..
node scripts/apply_database_fixes.js

echo.
echo Database fixes applied! Press any key to exit.
pause > nul

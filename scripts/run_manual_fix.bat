@echo off
echo Running manual database fix script...

cd %~dp0\..
node scripts/manual_db_fix.js

echo Done! Press any key to exit.
pause > nul

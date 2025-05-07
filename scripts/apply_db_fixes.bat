@echo off
REM This script applies database migrations to fix the exercise logging issues

echo Running manual database fix script...

REM Run the Node.js script to apply the database fixes
cd %~dp0\..
node scripts/manual_db_fix.js

echo Database fixes applied!
echo Restart the application to ensure changes take effect.

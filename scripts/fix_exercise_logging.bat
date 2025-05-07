# Fix Exercise Logging Function
# This batch file runs the PowerShell script to fix exercise logging issues

@echo off
echo Fixing exercise logging functions...

powershell.exe -ExecutionPolicy Bypass -File "%~dp0fix_exercise_logging.ps1"

pause

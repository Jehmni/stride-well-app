@echo off
echo Running Workout History Display Fix...
echo This will fix issues with completed workouts showing in the wrong section.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0fix_workout_history_all.ps1"

echo.
echo If the script was successful, your workout history should now display correctly.
echo.
pause

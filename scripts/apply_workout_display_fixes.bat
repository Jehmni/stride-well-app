@echo off
echo Running workout display fixes...

echo Applying workout history display fixes...
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/fix_workout_history_display.sql

echo Applying workout plan mapping fixes...
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/workout_plan_mapping.sql

echo Done!
echo.
echo If you're still experiencing issues with workout displays:
echo 1. Make sure the application is restarted
echo 2. Check browser console for any errors
echo 3. Verify that completed workouts are properly marked

pause

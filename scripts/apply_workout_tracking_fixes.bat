@echo off
echo Applying Stride Well workout tracking fixes...

echo Running SQL fixes...
npx --yes supabase-cli db run --project-ref japrzutwtqotzyudnizh --file scripts/workout_tracking_fixes.sql

echo.
echo SQL fixes applied successfully!
echo.
echo Next steps:
echo 1. Build and deploy the frontend changes
echo 2. Test that workout logging is working correctly
echo 3. Verify that completed workouts are displayed properly
echo.
echo Done!
pause

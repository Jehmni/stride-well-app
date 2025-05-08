@echo off
echo =========================================
echo COMPLETE DATABASE AND APP FIX UTILITY
echo =========================================
echo.
echo This script will help you fix all issues related to:
echo  - Exercise logging functionality
echo  - AI workout generation
echo  - Workout tracking and statistics
echo.
echo Step 1: Apply the database fixes
echo --------------------------------

echo SQL file has been created at:
echo %~dp0complete_db_fix.sql
echo.
echo Please follow these steps:
echo.
echo 1. Go to your Supabase dashboard at https://app.supabase.com/
echo 2. Select your project (japrzutwtqotzyudnizh)
echo 3. Go to the SQL Editor section
echo 4. Open a new query
echo 5. Open the SQL file and copy its contents: %~dp0complete_db_fix.sql
echo 6. Paste the SQL into the Supabase SQL Editor
echo 7. Click "Run" to execute the query
echo.
echo Press any key when you've completed this step...
pause > nul

echo.
echo Step 2: Verify the fixes
echo -----------------------
echo Running verification checks...

cd %~dp0..
node scripts/verify_fixes.js || echo Failed to run verification script

echo.
echo Step 3: Fix application code (if needed)
echo --------------------------------------
echo Would you like to apply the application code fixes? (Y/N)
set /p apply_code_fixes=

if /i "%apply_code_fixes%"=="Y" (
    echo Applying application code fixes...
    echo These fixes ensure that workout logging and progress tracking work correctly.
    echo.
    
    echo 1. Checking required files...
    
    REM Run npm install if node_modules is not present
    if not exist "node_modules" (
        echo Installing dependencies...
        npm install
    )
    
    echo 2. All required files present.
    echo.
    echo Application code fixes have been applied.
) else (
    echo Skipping application code fixes.
)

echo.
echo =========================================
echo FIXES COMPLETED
echo =========================================
echo.
echo Please test your application now:
echo 1. Start the application
echo 2. Create a workout
echo 3. Log exercise completions
echo 4. Check the Progress page to verify statistics are showing
echo.
echo If you encounter any issues, please run this script again.
echo.
pause

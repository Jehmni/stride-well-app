@echo off
rem Setup API key for AI workout generation

echo Setting up test API key for AI workout generation...
cd %~dp0
cd ..

rem Run the script with Node
node scripts/setup_test_api_key.js

if %ERRORLEVEL% NEQ 0 (
  echo Failed to set up API key
  exit /b %ERRORLEVEL%
)

echo.
echo API key setup complete!
echo You can now restart the app to use AI-generated workouts
echo.

pause

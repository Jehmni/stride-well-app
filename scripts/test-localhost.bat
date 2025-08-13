@echo off
echo 🔍 Testing localhost:8080 connectivity...
echo.

REM Test localhost connectivity
curl -s -o nul -w "localhost:8080 - Status: %%{http_code}, Time: %%{time_total}s\n" http://localhost:8080/ 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Cannot connect to localhost:8080
    echo.
    echo 💡 Possible solutions:
    echo 1. Make sure your dev server is running
    echo 2. Try running: npm run dev:localhost
    echo 3. Check if port 8080 is already in use
    echo 4. Try clearing cache: npm run clear-cache
) else (
    echo ✅ SUCCESS: localhost:8080 is accessible
)

echo.
echo 🔍 Testing 192.168.1.178:8080 connectivity...
curl -s -o nul -w "192.168.1.178:8080 - Status: %%{http_code}, Time: %%{time_total}s\n" http://192.168.1.178:8080/ 2>nul

echo.
echo 💡 If localhost fails but network IP works:
echo 1. The issue is likely in your Vite configuration
echo 2. Try running: npm run dev:localhost
echo 3. Check your hosts file for localhost entries
echo 4. Restart your development server
echo.
pause


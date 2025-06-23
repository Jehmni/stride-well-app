@echo off
echo Clearing Vite dependency cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)

echo.
echo Instructions for Chrome:
echo 1. Open Chrome DevTools (F12)
echo 2. Right-click on the refresh button
echo 3. Select "Empty Cache and Hard Reload"
echo.
echo OR
echo.
echo 1. Press Ctrl+Shift+Delete
echo 2. Select "Cached images and files"
echo 3. Click "Clear data"
echo.
echo Then restart the dev server with: npm run dev
pause

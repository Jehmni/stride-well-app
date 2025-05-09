#!/usr/bin/env pwsh

# Apply workout history display fixes
Write-Host "Applying workout history display fixes..." -ForegroundColor Cyan
Write-Host "This script will fix the issue where completed workouts appear in 'Your Custom Workouts' instead of 'Workout History'"

# Get the directory where the script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFilePath = Join-Path -Path $scriptDir -ChildPath "fix_workout_history_display.sql"
$jsFilePath = Join-Path -Path $scriptDir -ChildPath "fix_workout_history_supabase.js"

# Check if the required files exist
if (-not (Test-Path $sqlFilePath)) {
    Write-Host "Error: SQL file not found at $sqlFilePath" -ForegroundColor Red
    Exit 1
}

if (-not (Test-Path $jsFilePath)) {
    Write-Host "Error: JavaScript file not found at $jsFilePath" -ForegroundColor Red
    Exit 1
}

# Apply database schema changes with SQL first
try {
    Write-Host "Step 1/2: Applying database schema changes..." -ForegroundColor Yellow
    $connectionString = "postgresql://postgres:postgres@localhost:54322/postgres"
    & psql $connectionString -f $sqlFilePath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database schema changes applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "Warning: Database schema changes may have failed. Continuing with Supabase fixes..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Exit 1
}

# Run the JavaScript fix with Supabase client
try {
    Write-Host "Step 2/2: Applying Supabase data fixes..." -ForegroundColor Yellow
    
    # Check if Node.js is installed
    if (Get-Command node -ErrorAction SilentlyContinue) {
        # Run the JavaScript file
        $nodeProcess = Start-Process -FilePath "node" -ArgumentList "--input-type=module", $jsFilePath -NoNewWindow -PassThru -Wait
        
        if ($nodeProcess.ExitCode -eq 0) {
            Write-Host "Supabase data fixes applied successfully!" -ForegroundColor Green
        } else {
            Write-Host "Warning: Supabase data fixes may have failed. Exit code: $($nodeProcess.ExitCode)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: Node.js not found. Skipping Supabase data fixes." -ForegroundColor Yellow
        Write-Host "To complete all fixes, please install Node.js and run this script again." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error applying Supabase fixes: $_" -ForegroundColor Red
}

# Provide further instructions
Write-Host ""
Write-Host "Fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your application for changes to take effect"
Write-Host "2. Check the Progress tab to verify workout history is displaying correctly"
Write-Host "3. If issues persist, check the browser console for errors"
Write-Host ""

# Wait for user input before closing
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

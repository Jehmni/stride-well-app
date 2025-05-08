#!/usr/bin/env pwsh

Write-Host "Applying workout progress database migration..." -ForegroundColor Cyan

# Navigate to the root of the project
$rootDir = $PSScriptRoot | Split-Path -Parent

# Run the migration script
cd $rootDir
npx supabase migration up --file 20250508000000_add_workout_progress.sql

Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "The workout progress tracking system can now sync across devices." -ForegroundColor Green

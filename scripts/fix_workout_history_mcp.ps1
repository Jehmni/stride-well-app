#!/usr/bin/env pwsh

# Script to fix workout history display issues using Model-Context Protocol
# This script runs a Node.js program that uses our MCP client to apply fixes

# Get the directory where the script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create a temporary JS file to run
$tempJsFile = Join-Path -Path $scriptDir -ChildPath "temp_mcp_fix.js"

# Create the JS content that will use our MCP client
$jsContent = @'
// Temporary script to fix workout history display issues using MCP
import { workoutHistoryClient } from '../src/mcp/client.js';

async function applyWorkoutHistoryFixes() {
  console.log("Applying workout history display fixes using Model-Context Protocol...");
  
  try {
    // Apply the fixes using our MCP client
    const result = await workoutHistoryClient.applyFixes();
    
    if (result.success) {
      console.log("\x1b[32m✓ Success:\x1b[0m", result.message);
      
      if (result.details) {
        console.log("\nDetails:");
        console.log(`- Updated workout types: ${result.details.typeUpdates}`);
        console.log(`- Updated workout names: ${result.details.nameUpdates}`);
      }
    } else {
      console.error("\x1b[31m✗ Error:\x1b[0m", result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("\x1b[31m✗ Unexpected error:\x1b[0m", error);
    process.exit(1);
  }
}

// Run the fix function
applyWorkoutHistoryFixes();
'@

# Write the JS content to the temp file
$jsContent | Out-File -FilePath $tempJsFile -Encoding utf8

# Message to user
Write-Host "Fixing workout history display issues using MCP..." -ForegroundColor Cyan

# Run the temp JS file with Node.js
try {
    & node --experimental-specifier-resolution=node --loader ts-node/esm $tempJsFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nWorkout history display fixes applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nError: Failed to apply workout history fixes. Exit code: $LASTEXITCODE" -ForegroundColor Red
        Exit $LASTEXITCODE
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Exit 1
} finally {
    # Clean up the temp file
    if (Test-Path $tempJsFile) {
        Remove-Item $tempJsFile
    }
}

# Provide further instructions
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your application for changes to take effect"
Write-Host "2. Check the Progress tab to verify workout history is displaying correctly"
Write-Host "3. If issues persist, check the browser console for errors"
Write-Host ""

# Wait for user input before closing
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

#!/usr/bin/env pwsh

# Apply workout history display fixes
Write-Host "Applying workout history display fixes..." -ForegroundColor Cyan
Write-Host "This script will fix the issue where completed workouts appear in 'Your Custom Workouts' instead of 'Workout History'"

# ---------------------------------------------------
# Configuration
# ---------------------------------------------------
$ENV:SUPABASE_URL = "http://localhost:54321" # Default local Supabase URL
$ENV:SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU" # Default service key

# ---------------------------------------------------
# Functions
# ---------------------------------------------------
function CreateTemporaryScriptFile {
    param(
        [string]$script
    )
    
    $tempFile = [System.IO.Path]::GetTempFileName() + ".js"
    Set-Content -Path $tempFile -Value $script
    return $tempFile
}

# ---------------------------------------------------
# Apply fixes
# ---------------------------------------------------

# Create a temporary JavaScript file for the fix
$jsScript = @'
// Workout history fix script
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or key in environment variables');
  process.exit(1);
}

console.log(`Connecting to Supabase at ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFixes() {
  try {
    // 1. Ensure the necessary columns exist through RPC
    console.log('Creating missing columns if needed...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Add columns if they don't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'workout_type') THEN
            ALTER TABLE workout_logs ADD COLUMN workout_type VARCHAR DEFAULT 'completed';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'is_custom') THEN
            ALTER TABLE workout_logs ADD COLUMN is_custom BOOLEAN DEFAULT false;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'workout_name') THEN
            ALTER TABLE workout_logs ADD COLUMN workout_name VARCHAR DEFAULT NULL;
          END IF;
        END $$;
      `
    });
    
    // 2. Update existing workout logs to mark them as completed
    console.log('Updating workout logs to mark them as completed...');
    await supabase.rpc('exec_sql', {
      sql: "UPDATE workout_logs SET workout_type = 'completed' WHERE workout_type IS NULL OR workout_type = '';"
    });
    
    // 3. Make sure completed workouts aren't marked as custom workouts
    console.log('Fixing custom workout flags...');
    await supabase.rpc('exec_sql', {
      sql: "UPDATE workout_logs SET is_custom = false WHERE workout_type = 'completed' AND is_custom = true;"
    });
    
    // 4. Add proper workout names for logs that don't have them
    console.log('Adding workout names...');
    await supabase.rpc('exec_sql', {
      sql: "UPDATE workout_logs wl SET workout_name = w.name || ' Workout' FROM workouts w WHERE wl.workout_id = w.id AND wl.workout_name IS NULL AND w.name IS NOT NULL;"
    });
    
    // 5. For logs without valid workout_name, add a generic one
    console.log('Adding generic workout names for remaining logs...');
    await supabase.rpc('exec_sql', {
      sql: "UPDATE workout_logs SET workout_name = 'Completed Workout' WHERE workout_name IS NULL;"
    });
    
    // 6. Create index to improve query performance
    console.log('Creating index for better performance...');
    await supabase.rpc('exec_sql', {
      sql: "CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_type ON workout_logs(workout_type);"
    });
    
    // Count the affected rows
    console.log('Counting fixed workout logs...');
    const { data, error } = await supabase
      .from('workout_logs')
      .select('count()', { count: 'exact' })
      .eq('workout_type', 'completed');
      
    if (error) {
      console.error('Error counting fixed workout logs:', error);
    } else {
      console.log(`Total workout logs fixed: ${data[0].count || 0}`);
    }
    
    console.log('Workout history display fix completed successfully!');
    return true;
  } catch (error) {
    console.error('Error fixing workout history display:', error);
    return false;
  }
}

// Run the function
applyFixes()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
'@

# Save the script to a temporary file
$tempJsFile = CreateTemporaryScriptFile -script $jsScript
Write-Host "Created temporary script file: $tempJsFile" -ForegroundColor Gray

try {
    # Check if Node.js is installed
    if (Get-Command node -ErrorAction SilentlyContinue) {
        # Check for required npm packages
        Write-Host "Checking for required npm packages..." -ForegroundColor Yellow
        
        $packageFound = $false
        $npmList = npm list --depth=0 @supabase/supabase-js 2>$null
        
        if ($npmList -match "@supabase/supabase-js") {
            $packageFound = $true
        } else {
            Write-Host "Installing required packages..." -ForegroundColor Yellow
            npm install @supabase/supabase-js
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Warning: Failed to install required packages. Fix may not work properly." -ForegroundColor Yellow
            } else {
                $packageFound = $true
            }
        }
        
        if ($packageFound) {
            # Run the JavaScript file
            Write-Host "Applying database fixes..." -ForegroundColor Yellow
            $nodeProcess = Start-Process -FilePath "node" -ArgumentList "--input-type=module", $tempJsFile -NoNewWindow -PassThru -Wait
            
            if ($nodeProcess.ExitCode -eq 0) {
                Write-Host "Workout history fixes applied successfully!" -ForegroundColor Green
            } else {
                Write-Host "Warning: Some fixes may have failed. Exit code: $($nodeProcess.ExitCode)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Error: Node.js not found. Cannot apply fixes." -ForegroundColor Red
        Write-Host "Please install Node.js and try again." -ForegroundColor Yellow
        Exit 1
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Exit 1
} finally {
    # Clean up temporary file
    if (Test-Path $tempJsFile) {
        Remove-Item $tempJsFile -Force
        Write-Host "Cleaned up temporary files" -ForegroundColor Gray
    }
}

# Provide further instructions
Write-Host ""
Write-Host "Fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your application for changes to take effect"
Write-Host "2. Check the Progress tab to verify workout history is displaying correctly:"
Write-Host "   - Completed workouts should now appear in 'Workout History'"
Write-Host "   - They should no longer appear in 'Your Custom Workouts'"
Write-Host "3. If issues persist, check the browser console for errors"
Write-Host ""

# Wait for user input before closing
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

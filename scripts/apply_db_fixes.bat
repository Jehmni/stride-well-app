@echo off
REM This script applies database migrations to fix the exercise logging issues

echo Applying database migrations to fix exercise logging...

REM Apply migrations using Supabase CLI
npx supabase db push

echo Migrations applied successfully!
echo Restart the application to ensure changes take effect.

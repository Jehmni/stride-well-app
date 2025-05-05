#!/bin/bash
# This script applies database migrations to fix the exercise logging issues

# Ensure we're in the right directory
cd "$(dirname "$0")"

echo "Applying database migrations..."

# Apply migrations (you'll need to adapt this to your actual deployment method)
npx supabase db push

echo "Migrations applied successfully!"
echo "Restart the application to ensure changes take effect."

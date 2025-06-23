# DATABASE SCHEMA FIX GUIDE

## PROBLEM SUMMARY
The application code expects specific database tables and columns that don't exist or have wrong structures. This causes 500 errors and prevents workout logging functionality.

## REQUIRED TABLES AND COLUMNS (Based on Code Analysis)

### 1. **workout_logs** table
**Expected by code:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to user_profiles)
- `workout_id` (TEXT)
- `duration` (INTEGER) - used by workoutService.ts
- `calories_burned` (INTEGER) - used by stats hooks
- `notes` (TEXT)
- `rating` (INTEGER)
- `completed_at` (TIMESTAMP) - used by stats hooks
- `workout_type` (TEXT) - used by AI workout service
- `ai_workout_plan_id` (UUID) - used by AI workout service
- `is_custom` (BOOLEAN) - used by workoutService.ts
- `is_from_ai_plan` (BOOLEAN) - used by AI features
- `workout_description` (TEXT) - used by workoutService.ts
- `workout_name` (TEXT) - used by workoutService.ts
- `end_time` (TIMESTAMP) - **CRITICAL** used by useWorkoutStats.ts
- `date` (DATE) - **CRITICAL** used by useWorkoutStats.ts for weekly/daily filtering

### 2. **exercise_logs** table
**Expected by code:**
- `id` (UUID, primary key)
- `workout_log_id` (UUID, foreign key to workout_logs)
- `exercise_id` (UUID, foreign key to exercises)
- `sets_completed` (INTEGER) - used by workoutService.ts
- `reps_completed` (INTEGER) - used by workoutService.ts
- `weight_used` (NUMERIC) - used by workoutService.ts
- `notes` (TEXT)
- `completed_at` (TIMESTAMP)
- `workout_plan_id` (UUID) - used by some services

### 3. **workout_progress** table
**Expected by code:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to user_profiles)
- `workout_id` (TEXT)
- `completed_exercises` (TEXT[]) - array of exercise IDs
- `last_updated` (TIMESTAMP)

## HOW TO APPLY THE FIX

### Option 1: Supabase Dashboard (RECOMMENDED)
1. Open your Supabase project dashboard
2. Go to "SQL Editor"
3. Copy and paste the entire contents of `create_proper_schema.sql`
4. Click "Run" to execute the migration
5. Verify tables were created correctly

### Option 2: Supabase CLI (Alternative)
```bash
# If you have Supabase CLI installed
supabase db reset
supabase db push
```

### Option 3: Manual Application via Script
Run the test script to verify it worked:

```bash
node test_schema_fix.mjs
```

## CRITICAL NOTES

1. **This will DROP existing tables** - Make sure you backup any important data first
2. **RLS policies are included** - Users can only access their own data
3. **All required indexes are created** - For optimal performance
4. **RPC functions are included** - For backward compatibility with existing code

## VERIFICATION

After applying the schema, the following should work:
- ✅ AI workout generation and completion logging
- ✅ Manual workout logging
- ✅ Exercise logging within workouts
- ✅ Workout statistics and progress tracking
- ✅ All dashboard components should load without 500 errors

## WHAT THIS FIXES

- ❌ `Could not find the 'duration' column` → ✅ Column exists
- ❌ `Could not find the 'reps_completed' column` → ✅ Column exists  
- ❌ `Could not find the 'completed_exercises' column` → ✅ Column exists
- ❌ `new row violates row-level security policy` → ✅ Proper RLS policies
- ❌ WorkoutStatistics.tsx 500 errors → ✅ All expected columns exist
- ❌ AI workout completion fails → ✅ Proper logging functions exist

-- Clear all AI-generated workout plans for fresh testing
-- This is a temporary script to help with testing AI workout generation

-- Delete all existing AI-generated workout plans
DELETE FROM public.workout_plans 
WHERE ai_generated = true;

-- Clear any cached data (this would be done in the app, but noting here)
-- localStorage.clear(); // This needs to be done in browser console

-- Verify the deletion
SELECT COUNT(*) as remaining_ai_plans 
FROM public.workout_plans 
WHERE ai_generated = true;

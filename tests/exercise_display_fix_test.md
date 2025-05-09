# Test Script for Exercise Display Fix in WorkoutProgress Component

## Issue Overview
This test script verifies the fix for "Full Body & Cardio Workout" plan where exercises were not showing up.
The issue was that AI-generated workout plans stored exercise data in a JSON field but didn't map this data to actual database entries.

## Prerequisites
1. Logged in to the Stride Well app
2. Have at least one AI-generated workout plan in your profile

## Test Cases

### Test Case 1: View AI Workout Plan in Today's Workout
1. Log in to the application
2. Navigate to the Home page
3. Find "Today's Workout" section 
4. If your workout is an AI-generated plan, click "Start Workout"
5. **Expected Result:** Exercises should be properly displayed in the workout progress view

### Test Case 2: Test the Mapper Function
1. Open browser console
2. In the console, run:
   ```javascript
   // Get the user's workout plan ID first
   const { data } = await supabase.from('workout_plans').select('id').eq('ai_generated', true).limit(1);
   const planId = data[0].id;
   
   // Test the mapping function
   import { getWorkoutPlanExercises } from "./src/services/workoutPlanMapper";
   const exercises = await getWorkoutPlanExercises(planId);
   console.log("Mapped exercises:", exercises);
   ```
3. **Expected Result:** Console should show the mapped exercises

### Test Case 3: Database Verification
1. Open Supabase dashboard
2. Navigate to the SQL editor
3. Run the following queries:
   ```sql
   -- Check if workout plans have been properly mapped
   SELECT id, title, mapped_exercises, workout_id 
   FROM workout_plans 
   WHERE ai_generated = true;
   
   -- For plans that have been mapped, check their exercises
   SELECT we.* 
   FROM workout_exercises we
   JOIN workout_plans wp ON we.workout_id = wp.workout_id
   WHERE wp.ai_generated = true
   ORDER BY we.order_position;
   ```
4. **Expected Result:** The queries should return workout plans with mapped_exercises = true and their corresponding exercises

## Regression Testing
1. Create a new workout plan using the AI generator
2. Verify that exercises are properly displayed when starting the workout
3. Complete a workout and verify that progress is accurately tracked

## Notes
- If exercises still don't appear, check the browser console for errors
- The mapper function creates a corresponding entry in the workouts table and links it to the workout plan
- After the first time accessing a workout plan, subsequent accesses should be faster due to the pre-mapped exercises

# AI Workout Feature Test Plan

## Test Steps

### 1. Login and Navigation
- [ ] Login to the app at http://localhost:8081
- [ ] Navigate to Dashboard
- [ ] Verify AI Workout Card is displayed
- [ ] Check if "Create AI Workout" button is enabled

### 2. AI Workout Creation
- [ ] Click "Create AI Workout" button
- [ ] Verify navigation to `/create-ai-workout` page
- [ ] Fill out the Enhanced AI Workout Form:
  - Primary Fitness Goal: Select one (e.g., "Muscle Gain")
  - Days Per Week: Select (e.g., 3-4 days)
  - Workout Duration: Select (e.g., 45-60 minutes)
  - Available Equipment: Select some options
  - Focus Areas: Select some options
  - Specific Goals: Enter optional text
- [ ] Click "Generate Workout Plan"

### 3. AI Generation Process
- [ ] Verify loading spinner appears
- [ ] Check browser console for any errors
- [ ] Verify OpenAI API call is made successfully
- [ ] Check that response is processed correctly
- [ ] Verify workout plan is saved to Supabase

### 4. Workout Plan Display
- [ ] Verify navigation to workout plan detail page
- [ ] Check that the generated plan displays correctly
- [ ] Verify exercises are shown with proper structure
- [ ] Check that plan includes user-specific details

### 5. Data Persistence
- [ ] Navigate back to Dashboard
- [ ] Verify AI Workout Card shows updated count
- [ ] Check that saved workout plans are accessible
- [ ] Verify plans can be viewed again

## Expected Behavior

The AI workout feature should:
1. Use the user's profile data (age, sex, height, weight, fitness goal)
2. Incorporate form selections (equipment, focus areas, etc.)
3. Generate personalized workout plans via OpenAI
4. Save plans to Supabase with proper structure
5. Display plans in a user-friendly format
6. Allow users to access their saved AI-generated plans

## Common Issues to Check

1. **OpenAI API Errors**: 401 Unauthorized, 429 Rate Limit, etc.
2. **Supabase Errors**: Missing columns, RLS policy issues, etc.
3. **React Warnings**: Missing keys, NaN values, etc.
4. **Navigation Issues**: Broken routes, missing components, etc.
5. **Data Validation**: Incomplete forms, missing required fields, etc.

## Test Environment

- URL: http://localhost:8081
- OpenAI API Key: Configured in .env
- Supabase: Production database with proper schema
- Browser: Chrome DevTools open for debugging

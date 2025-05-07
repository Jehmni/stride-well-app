# AI-Powered Workout Plan Feature

This document describes the new AI-powered workout plan generation feature added to the Stride Well app.

## Overview

The app now uses AI to generate personalized workout plans for users based on their fitness goals, age, sex, height, weight, and other profile information. This replaces the previous rule-based approach with a more intelligent system that can create truly tailored workout plans.

## Features

1. **AI Workout Generation**
   - Uses machine learning to create personalized workout plans
   - Adapts recommendations based on user profile data
   - Creates a full 7-day workout schedule with appropriate rest days
   - Selects exercises from the database that match the user's needs

2. **User Interface Enhancements**
   - Visual indicator showing when workouts are AI-generated
   - Loading state during AI plan generation
   - Option to regenerate AI workout plans

3. **Integration with Exercise Logging**
   - AI-generated workouts work with the existing exercise logging system
   - Completed exercises from AI workouts appear in progress views

## Technical Implementation

### New Components

- `AIGeneratedNotice`: UI component that shows users when content is AI-generated
- `workoutAI.ts`: Core AI integration for generating workout plans
- `aiConfig.ts`: Configuration system for AI services

### Database Changes

- Added `ai_generated` flag to workout plans
- Added `user_id` field to associate plans with specific users
- Created `ai_configurations` table to store API keys and settings

### API Integration

The system integrates with OpenAI's GPT-4o (or compatible models) to generate workout plans. API keys can be provided either through:

1. Environment variables:
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_API_URL` 
   - `VITE_OPENAI_MODEL`

2. Database configuration (for production use)

## Setup Instructions

### 1. API Key Configuration

To enable AI workout generation, set up your API key in one of these ways:

**Option 1: Environment Variables**  
Add these variables to your `.env` file:
```
VITE_OPENAI_API_KEY=your-api-key
VITE_OPENAI_MODEL=gpt-4o
VITE_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

**Option 2: Database Configuration**  
Update the `ai_configurations` table:
```sql
UPDATE public.ai_configurations 
SET api_key='your-api-key', is_enabled=true
WHERE service_name='openai';
```

### 2. Apply Database Migrations

Run the migration script to add new database tables and fields:
```bash
npx supabase db push
```

## Testing

To test the AI workout generation:
1. Log in as a user
2. Navigate to the Workout Plan page
3. Observe the AI-generated workout notice
4. Click "Regenerate Plan" to create a new AI workout

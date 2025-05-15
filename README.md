# CorePilot - AI-Powered Fitness Trainer

CorePilot is a comprehensive fitness application that provides personalized workout routines and meal plans based on your specific fitness goals and profile.

## Features

- **Personalized Workout Plans**: Get customized workout routines based on your fitness goals, experience level, and personal preferences.
- **AI-Generated Workouts**: Generate specialized workout plans using OpenAI GPT.
- **Progress Tracking**: Monitor your fitness journey with detailed statistics and visual charts.
- **Meal Planning**: Access tailored nutrition plans and recipes to support your fitness goals.
- **Social Features**: Connect with friends, share workouts, and participate in challenges.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/corepilot.git
   cd corepilot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Configure OpenAI API:
   - Sign up for an OpenAI API key at https://platform.openai.com
   - Log into the app and go to the AI Configuration section
   - Enter your OpenAI API key in the settings

### Running the Application

Start the development server:
```
npm run dev
```

## Using AI-Generated Workouts

1. Navigate to the "AI Workouts" page using the sidebar menu
2. Click on "Generate New Plan" button
3. Your personalized workout plan will be created based on your profile data
4. View and expand the workout details
5. Use your generated workout plan in your regular exercise routine

## Troubleshooting

If AI workouts are not appearing or generating:

1. Ensure your OpenAI API key is correctly set in the Supabase database
2. Verify that you have completed your user profile with all required information
3. Check the browser console for any error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Workout Interface Improvements

We've made several key improvements to the workout interface to enhance user experience and reduce code duplication:

### 1. Enhanced Exercise Tracker Component
- Combined exercise tracking and logging in a single component
- Added collapsible details section for each exercise with:
  - Weight tracking
  - Note taking 
  - Set/rep completion
  - Progress visualization
- Improved UI with progress indicators and muscle group badges

### 2. Streamlined Workout Logging
- Simplified the workout logging flow by removing redundant tabs
- Consolidated exercise data collection within the workout flow
- Auto-collected exercise data is now used in the log submission
- Improved UX with clear exercise status indicators

### 3. Reset Functionality
- Added a "Reset All" button with confirmation dialog
- Provided better tooltips for user guidance
- Implemented proper state handling for workout resets

### 4. Reduced Component Redundancy
- Eliminated redundant form components between ExerciseTracker and ExerciseLogForm
- Consolidated workout completion logic
- Improved data flow between components

### Next Improvement Ideas
- Implement offline support with better sync indicators
- Add workout templates for quick starts
- Enhance progress visualizations with animated transitions
- Improve sharing capabilities for workout achievements

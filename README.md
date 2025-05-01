# CorePilot Fitness App

A personalized fitness app that provides customized workout routines, nutrition plans, and progress tracking based on your fitness goals.

**URL**: https://lovable.dev/projects/e1eae57c-3fcc-4296-80c6-882abfb74efc

## Features

- **Personalized Fitness Plans**: Customized workout routines based on your fitness level, goals, and available equipment.
- **Nutrition Guidelines**: Tailored meal plans and nutritional advice to fuel your workouts and reach your goals faster.
- **Progress Tracking**: Monitor your growth and achievements with visual charts and insightful analytics.
- **User Authentication**: Secure login system to keep your fitness data safe and accessible.
- **User Profile Management**: Update your personal information and fitness goals at any time.

## Tech Stack

- React with TypeScript
- Vite for development
- Tailwind CSS for styling
- shadcn/ui component library
- Supabase for authentication and database
- React Query for data fetching
- React Router for navigation
- Recharts for data visualization

## Setup Instructions

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account - [create here](https://supabase.com/)

### Step 1: Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Install Dependencies

```sh
npm install
```

### Step 3: Set Up Supabase

1. Create a new Supabase project from the [Supabase Dashboard](https://app.supabase.com/)
2. Go to Project Settings > API and copy the Project URL and anon public API key
3. Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the database migrations to set up the schema:

```sh
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### Step 4: Start the Development Server

```sh
npm run dev
```

The app will be available at http://localhost:5173

## Database Structure

The app uses the following tables in Supabase:

- `user_profiles`: Stores user information and fitness goals
- `workout_plans`: Contains workout plan templates for different fitness goals
- `meal_plans`: Contains meal plan templates for different fitness goals
- `user_meal_plans`: Stores user-saved meal plans
- `completed_workouts`: Tracks completed workout sessions
- `weight_records`: Tracks user weight over time
- `strength_records`: Tracks strength progress for various exercises
- `body_measurements`: Stores body measurement data
- `meal_logs`: Tracks meals consumed by users

## Authentication Flow

The app uses Supabase Auth for user authentication:

1. User signs up/logs in using the login page
2. Upon successful authentication, the user is redirected to:
   - Onboarding page (if profile is incomplete)
   - Dashboard (if profile is complete)
3. The app makes authenticated API calls to Supabase using the user's session token

## Development Notes

### Adding New Features

When adding new features:

1. Create new components in the appropriate directory
2. Update database types if necessary in `src/integrations/supabase/types.ts`
3. Add any new API functions in hooks or within the components

### Styling

The app uses Tailwind CSS for styling with the shadcn/ui component library. The design system follows these conventions:

- Primary color: `fitness-primary` (customized in the Tailwind config)
- Secondary color: `fitness-secondary` (customized in the Tailwind config)
- Accent color: `fitness-accent` (customized in the Tailwind config)

## Deployment

The app can be deployed using Supabase and your preferred hosting service. Follow these steps:

1. Build the app for production:

```sh
npm run build
```

2. Host the output from the `dist` folder on Netlify, Vercel, or any other static hosting service.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e1eae57c-3fcc-4296-80c6-882abfb74efc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

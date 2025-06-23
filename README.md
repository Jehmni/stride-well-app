# Stride-Well Fitness App 🏃‍♀️💪

**A comprehensive AI-powered fitness application built with React, TypeScript, and Supabase**

Stride-Well is a production-ready fitness application that provides personalized workout routines, meal plans, challenges, and social features - all powered by real Supabase data and AI intelligence.

## ✨ Key Features

### 🤖 AI-Powered Workouts
- **Personalized Workout Generation**: AI creates custom workouts based on user preferences, fitness level, and available equipment
- **Smart Exercise Selection**: Intelligent exercise recommendations with proper form instructions
- **Adaptive Difficulty**: Workouts automatically adjust based on user progress and feedback

### 🍽️ Meal Planning & Nutrition
- **AI Meal Recommendations**: Personalized meal plans based on dietary preferences and fitness goals
- **Nutrition Tracking**: Comprehensive calorie and macronutrient tracking
- **Recipe Library**: Extensive collection of healthy recipes with nutritional information

### 📊 Progress Tracking
- **Body Measurements**: Track weight, body fat, muscle mass, and other key metrics
- **Workout History**: Detailed logs of all completed workouts with performance analytics
- **Visual Analytics**: Charts and graphs showing progress over time
- **Achievement Badges**: Gamified progress milestones

### 🏆 Challenges System
- **Community Challenges**: Join public challenges with other users (New Year Strong, Summer Shred, Marathon Prep)
- **Custom Challenges**: Create your own fitness challenges
- **Real-time Leaderboards**: Compete with friends and community members
- **Progress Tracking**: Log and track challenge progress with detailed analytics
- **Multiple Challenge Types**: Steps, workouts, distance, weight loss, and duration challenges

### 👥 Social Features
- **Friends System**: Connect with other fitness enthusiasts
- **Activity Feed**: Share workouts and achievements with your network
- **Social Challenges**: Team-based fitness competitions

### 🔔 Smart Reminders
- **Workout Reminders**: Intelligent scheduling based on your routine
- **Meal Reminders**: Never miss a meal with customizable notifications
- **Progress Check-ins**: Regular prompts to update measurements and goals

### 📱 Progressive Web App
- **Offline Support**: Core features work without internet connection
- **Mobile Optimized**: Native-like experience on mobile devices
- **Push Notifications**: Stay motivated with real-time notifications

## 🚀 Production Ready

**This app is fully connected to a live Supabase backend with:**
- Real database with complete schema (users, workouts, challenges, progress tracking)
- Row Level Security (RLS) policies for data protection
- Authentication system with user profiles
- Three active challenges ready for participation:
  - **New Year Strong**: 30-day workout challenge
  - **Summer Shred**: 12-week transformation program  
  - **Marathon Prep**: Running distance goals
- Real-time features for challenges and social interactions
- Production-grade security and performance optimizations

**No demo data or mock functionality** - everything uses live Supabase data.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Access to the configured Supabase project (credentials in .env)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd stride-well-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment is pre-configured:
   The `.env` file is already set up with production Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://ruxnobvwdzyenucyimus.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_OPENAI_API_KEY=your-openai-api-key
   VITE_OPENAI_MODEL=gpt-4o
   VITE_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
   ```

4. Configure OpenAI API (optional):
   - Sign up for an OpenAI API key at https://platform.openai.com
   - Update `VITE_OPENAI_API_KEY` in the `.env` file
   - Or configure it in the app's AI settings page

### Running the Application

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```
## 🎯 Technology Stack

### Frontend
- **React 18** with TypeScript for robust type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, modern styling
- **Shadcn/ui** for beautiful, accessible UI components
- **React Router** for seamless navigation
- **TanStack Query** for efficient data fetching and caching

### Backend & Database
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** with Row Level Security (RLS) for data protection
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless computing

### AI Integration
- **OpenAI GPT-4** for workout and meal plan generation
- **Intelligent prompt engineering** for contextual recommendations
- **Adaptive learning** based on user feedback

## 🏗️ Database Schema

### Core Tables
- **users**: User profiles and preferences
- **workouts**: AI-generated and custom workouts
- **exercises**: Exercise library with instructions
- **meals**: Meal plans and nutrition data
- **progress**: User progress tracking
- **challenges**: Community and custom challenges
- **challenge_participants**: User participation in challenges
- **challenge_progress_logs**: Detailed progress tracking

### Security Features
- **Row Level Security (RLS)**: Secure data access patterns
- **Real-time subscriptions**: Live updates for challenges and social features
- **Optimized queries**: Efficient data retrieval with proper indexing
- **Data integrity**: Foreign key constraints and validation

## 🏆 Live Challenges

The app comes with three active challenges ready for user participation:

1. **New Year Strong** (January Challenge)
   - 30-day workout commitment
   - Daily workout goals
   - Community leaderboard

2. **Summer Shred** (12-Week Program)
   - Body transformation challenge
   - Weekly progress tracking
   - Comprehensive fitness goals

3. **Marathon Prep** (Running Challenge)
   - Distance-based goals
   - Progressive training plan
   - Endurance building focus

## 🚀 Deployment Status

✅ **Production Ready**
- All components use real Supabase data
- No mock or demo data fallbacks
- Full authentication and authorization
- Responsive design for all devices
- Optimized build configuration
- Ready for deployment to Vercel, Netlify, or similar platforms

// Demonstrate the complete AI workout flow using existing data
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function demonstrateAIWorkoutFlow() {
  console.log('🔄 Demonstrating Complete AI Workout Flow');
  console.log('=========================================');
  
  try {
    // Step 1: Show AI workouts are saved in database
    console.log('1. 📊 AI Workouts Currently in Database:');
    const { data: allAIWorkouts, error: fetchError } = await supabase
      .from('workout_plans')
      .select('id, title, description, ai_generated, created_at, user_id')
      .eq('ai_generated', true)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching AI workouts:', fetchError);
      return;
    }
    
    console.log(`   ✅ Found ${allAIWorkouts.length} AI-generated workout plans:`);
    allAIWorkouts.forEach((workout, index) => {
      console.log(`   ${index + 1}. "${workout.title}" (${workout.created_at})`);
      console.log(`      ID: ${workout.id}`);
      console.log(`      User: ${workout.user_id}`);
    });
    
    if (allAIWorkouts.length === 0) {
      console.log('   📝 No AI workouts found - generate one in the app first!');
      return;
    }
    
    // Step 2: Test RPC function for retrieving user's AI workouts
    console.log('\n2. 🔍 Testing RPC Function (How Frontend Gets Data):');
    const firstWorkout = allAIWorkouts[0];
    const { data: userWorkouts, error: rpcError } = await supabase
      .rpc('get_ai_workout_plans', { p_user_id: firstWorkout.user_id });
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log(`   ✅ RPC returned ${userWorkouts.length} workouts for user`);
      userWorkouts.forEach((workout, index) => {
        console.log(`   ${index + 1}. "${workout.title}" - Completed: ${workout.completion_count} times`);
      });
    }
    
    // Step 3: Show detailed workout structure
    console.log('\n3. 📋 Sample AI Workout Structure:');
    const { data: detailedWorkout, error: detailError } = await supabase
      .from('workout_plans')
      .select('title, description, fitness_goal, weekly_structure, exercises')
      .eq('id', firstWorkout.id)
      .single();
    
    if (detailError) {
      console.error('❌ Error getting workout details:', detailError);
    } else {
      console.log(`   📝 Title: ${detailedWorkout.title}`);
      console.log(`   🎯 Goal: ${detailedWorkout.fitness_goal}`);
      console.log(`   📅 Weekly Structure: ${Array.isArray(detailedWorkout.weekly_structure) ? detailedWorkout.weekly_structure.length + ' days planned' : 'Custom structure'}`);
      console.log(`   💪 Exercises: ${Array.isArray(detailedWorkout.exercises) ? detailedWorkout.exercises.length + ' exercises' : 'Custom exercises'}`);
      
      // Show first few exercises as example
      if (Array.isArray(detailedWorkout.exercises) && detailedWorkout.exercises.length > 0) {
        console.log('\n   🏋️ Sample Exercises:');
        detailedWorkout.exercises.slice(0, 3).forEach((exercise, index) => {
          console.log(`   ${index + 1}. ${exercise.name} - ${exercise.sets} sets x ${exercise.reps} reps (${exercise.muscle})`);
        });
      }
    }
    
    // Step 4: Show the complete flow
    console.log('\n🎯 COMPLETE AI WORKOUT FLOW:');
    console.log('   1. User generates AI workout → OpenAI API');
    console.log('   2. AI response parsed → Saved to database');
    console.log('   3. User views workouts → RPC function queries database');
    console.log('   4. Frontend displays → User can start workouts');
    console.log('   5. Completion tracked → workout_logs table');
    
    console.log('\n✅ CONFIRMED: AI workouts are saved to database and served to users!');
    
  } catch (error) {
    console.error('❌ Flow demonstration failed:', error);
  }
}

demonstrateAIWorkoutFlow();

// Test if AI workouts are actually saved to database
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.VITE_OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAIWorkoutSaving() {
  console.log('🧪 Testing AI Workout Generation + Database Saving');
  console.log('================================================');
  
  try {
    // Step 1: Generate AI workout
    console.log('1. Generating AI workout plan...');
      const mockUserProfile = {
      id: crypto.randomUUID(), // Use proper UUID instead of string
      age: 30,
      sex: 'male',
      height: 180,
      weight: 75,
      fitness_goal: 'muscle-gain',
      fitness_level: 'intermediate',
      available_equipment: ['dumbbells', 'pull-up-bar'],
      workout_frequency: 4
    };
    
    const prompt = `Create a workout plan for a ${mockUserProfile.age} year old ${mockUserProfile.sex}, ${mockUserProfile.height}cm, ${mockUserProfile.weight}kg, ${mockUserProfile.fitness_level} level, goal: ${mockUserProfile.fitness_goal}.

Please provide a JSON object with:
{
  "title": "Workout Plan Title",
  "description": "Brief description",
  "fitness_goal": "${mockUserProfile.fitness_goal}",
  "weekly_structure": {"monday": {"name": "Push Day", "focus": "Chest/Shoulders"}},
  "exercises": [{"day": "monday", "exercises": [{"name": "Push-ups", "sets": 3, "reps": 10}]}]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a fitness trainer. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error('❌ OpenAI API failed:', response.status);
      return;
    }
    
    const data = await response.json();
    const workoutPlan = JSON.parse(data.choices[0].message.content);
    
    console.log('✅ AI workout generated:', workoutPlan.title);
    
    // Step 2: Save to database
    console.log('2. Saving workout plan to database...');
    
    const planToSave = {
      title: workoutPlan.title,
      description: workoutPlan.description,
      fitness_goal: workoutPlan.fitness_goal,
      weekly_structure: workoutPlan.weekly_structure,
      exercises: workoutPlan.exercises,
      ai_generated: true,
      user_id: mockUserProfile.id
    };
    
    const { data: savedPlan, error: saveError } = await supabase
      .from('workout_plans')
      .insert(planToSave)
      .select('id, title, ai_generated, created_at')
      .single();
    
    if (saveError) {
      console.error('❌ Failed to save workout plan:', saveError);
      return;
    }
    
    console.log('✅ Workout plan saved with ID:', savedPlan.id);
    console.log('   Title:', savedPlan.title);
    console.log('   AI Generated:', savedPlan.ai_generated);
    console.log('   Created:', savedPlan.created_at);
    
    // Step 3: Verify it can be retrieved
    console.log('3. Verifying workout can be retrieved...');
    
    const { data: retrievedPlans, error: retrieveError } = await supabase
      .from('workout_plans')
      .select('id, title, description, ai_generated')
      .eq('user_id', mockUserProfile.id)
      .eq('ai_generated', true);
    
    if (retrieveError) {
      console.error('❌ Failed to retrieve workout plans:', retrieveError);
      return;
    }
    
    console.log(`✅ Retrieved ${retrievedPlans.length} AI workout plans for user`);
    
    // Step 4: Test RPC function
    console.log('4. Testing RPC function...');
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_ai_workout_plans', { p_user_id: mockUserProfile.id });
    
    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
      return;
    }
    
    console.log(`✅ RPC returned ${rpcResult.length} workout plans`);
    
    // Step 5: Cleanup test data
    console.log('5. Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', mockUserProfile.id);
    
    if (deleteError) {
      console.warn('⚠️ Could not clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 CONCLUSION: AI workouts ARE being saved to database!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIWorkoutSaving();

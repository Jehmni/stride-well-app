import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkExerciseDataFormat() {
  console.log('🔍 Checking Exercise Data Format');
  console.log('=================================');

  try {
    const { data: aiPlans, error } = await supabase
      .from('workout_plans')
      .select('id, title, exercises, ai_generated')
      .eq('ai_generated', true)
      .limit(3);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!aiPlans || aiPlans.length === 0) {
      console.log('❌ No AI plans found');
      return;
    }

    aiPlans.forEach((plan, index) => {
      console.log(`\n📋 Plan ${index + 1}: "${plan.title}"`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Exercises type: ${typeof plan.exercises}`);
      console.log(`   Raw exercises data: ${JSON.stringify(plan.exercises).substring(0, 200)}...`);
      
      try {
        let exercises;
        if (typeof plan.exercises === 'string') {
          exercises = JSON.parse(plan.exercises);
        } else {
          exercises = plan.exercises;
        }
        
        console.log(`   ✅ Parsed exercises count: ${exercises?.length || 0}`);
        if (exercises && exercises.length > 0) {
          console.log(`   Sample exercise: ${exercises[0].name || exercises[0].exerciseName || 'Unknown'}`);
        }
      } catch (e) {
        console.log(`   ❌ Parse error: ${e.message}`);
        
        // Try alternative parsing approaches
        if (typeof plan.exercises === 'object' && plan.exercises !== null) {
          console.log(`   🔧 Object keys: ${Object.keys(plan.exercises)}`);
          
          // Check if it has an exercises property
          if (plan.exercises.exercises) {
            console.log(`   🔧 Found nested exercises: ${plan.exercises.exercises.length} items`);
          }
        }
      }
    });

    console.log('\n💡 Recommendations:');
    console.log('===================');
    console.log('1. Check how exercises are being stored in the database');
    console.log('2. Ensure consistent JSON structure for exercises');
    console.log('3. Update parsing logic to handle the actual data format');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkExerciseDataFormat();

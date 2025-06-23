import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseDatabaseSchema() {
  console.log('🔍 Database Schema Diagnosis Report');
  console.log('===================================');

  try {
    // Try to find what columns actually exist by testing minimal inserts
    console.log('\n1. Discovering actual workout_logs schema...');
    
    const { data: aiPlans } = await supabase
      .from('workout_plans')
      .select('id, user_id')
      .eq('ai_generated', true)
      .limit(1);
    
    if (!aiPlans || aiPlans.length === 0) {
      console.log('❌ No AI plans for testing');
      return;
    }

    const testUserId = aiPlans[0].user_id;
    const testPlanId = aiPlans[0].id;

    // Test core columns that should definitely exist
    const coreColumns = ['user_id'];
    const optionalColumns = [
      'notes', 'rating', 'calories_burned', 'completed_at',
      'workout_id', 'duration', 'ai_workout_plan_id', 'workout_type',
      'exercises_completed', 'total_exercises', 'workout_name', 
      'workout_description', 'is_custom', 'is_from_ai_plan'
    ];

    let workingColumns = [...coreColumns];
    
    console.log('\n2. Testing individual columns...');
    
    for (const column of optionalColumns) {
      const testValue = 
        column === 'notes' ? 'test' :
        column === 'rating' ? 5 :
        column === 'calories_burned' ? 100 :
        column === 'completed_at' ? new Date().toISOString() :
        column === 'workout_id' ? testPlanId :
        column === 'duration' ? 30 :
        column === 'ai_workout_plan_id' ? testPlanId :
        column === 'workout_type' ? 'test' :
        column === 'exercises_completed' ? 5 :
        column === 'total_exercises' ? 8 :
        column === 'workout_name' ? 'Test Workout' :
        column === 'workout_description' ? 'Test Description' :
        column === 'is_custom' ? true :
        column === 'is_from_ai_plan' ? true :
        'test_value';

      const testData = {
        user_id: testUserId,
        [column]: testValue
      };

      try {
        const { error } = await supabase
          .from('workout_logs')
          .insert(testData);
        
        if (error) {
          if (error.message.includes('row-level security')) {
            console.log(`   ✅ ${column}: exists (RLS blocked)`);
            workingColumns.push(column);
          } else if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
            console.log(`   ❌ ${column}: missing`);
          } else {
            console.log(`   ⚠️  ${column}: exists but ${error.message.split('.')[0]}`);
            workingColumns.push(column);
          }
        } else {
          console.log(`   ✅ ${column}: exists and working`);
          workingColumns.push(column);
        }
      } catch (e) {
        console.log(`   ❌ ${column}: ${e.message.split('.')[0]}`);
      }
    }

    console.log('\n3. Summary of workout_logs schema');
    console.log('=================================');
    console.log('✅ Working columns:', workingColumns);
    
    const missingColumns = optionalColumns.filter(col => !workingColumns.includes(col));
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
    }

    // Check what our code expects vs what exists
    console.log('\n4. Code vs Database Analysis');
    console.log('============================');
    
    const expectedByCode = [
      'user_id', 'workout_id', 'duration', 'ai_workout_plan_id', 
      'workout_type', 'exercises_completed', 'total_exercises',
      'calories_burned', 'notes', 'rating', 'completed_at'
    ];
    
    const missingForCode = expectedByCode.filter(col => !workingColumns.includes(col));
    
    if (missingForCode.length === 0) {
      console.log('✅ All required columns exist for AI workout completion');
    } else {
      console.log('❌ Missing columns needed for AI workout completion:');
      missingForCode.forEach(col => console.log(`   - ${col}`));
      
      console.log('\n💡 Recommendations:');
      console.log('1. Database migrations may not have been applied');
      console.log('2. Schema cache may be out of sync');
      console.log('3. Manual schema updates may be needed');
    }

    // Check TypeScript types vs reality
    console.log('\n5. TypeScript Types vs Database Reality');
    console.log('=====================================');
    const typescriptColumns = [
      'calories_burned', 'completed_at', 'duration', 'id', 'is_custom',
      'notes', 'rating', 'user_id', 'workout_description', 'workout_id',
      'workout_name', 'workout_type', 'is_from_ai_plan', 'ai_workout_plan_id'
    ];
    
    const typeMismatches = typescriptColumns.filter(col => !workingColumns.includes(col));
    if (typeMismatches.length === 0) {
      console.log('✅ TypeScript types match database schema');
    } else {
      console.log('❌ TypeScript types include columns not in database:');
      typeMismatches.forEach(col => console.log(`   - ${col}`));
      console.log('\n💡 Suggestion: Regenerate TypeScript types after fixing schema');
    }

    console.log('\n🎉 Diagnosis complete!');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseDatabaseSchema();

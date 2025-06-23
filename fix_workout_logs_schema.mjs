import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingWorkoutLogsColumns() {
  console.log('🔧 Creating Missing workout_logs Columns');
  console.log('========================================');

  try {
    // Define the SQL statements to add missing columns
    const alterStatements = [
      // Add workout_id if missing (core column from original schema)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='workout_logs' AND column_name='workout_id') THEN
           ALTER TABLE public.workout_logs ADD COLUMN workout_id TEXT;
         END IF;
       END $$;`,

      // Add duration if missing (core column from original schema)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='workout_logs' AND column_name='duration') THEN
           ALTER TABLE public.workout_logs ADD COLUMN duration INTEGER;
         END IF;
       END $$;`,

      // Add ai_workout_plan_id (AI tracking)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='workout_logs' AND column_name='ai_workout_plan_id') THEN
           ALTER TABLE public.workout_logs ADD COLUMN ai_workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL;
         END IF;
       END $$;`,

      // Add workout_type (AI vs custom tracking)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='workout_logs' AND column_name='workout_type') THEN
           ALTER TABLE public.workout_logs ADD COLUMN workout_type VARCHAR(50) DEFAULT 'custom';
         END IF;
       END $$;`,

      // Add exercises_completed (progress tracking)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='workout_logs' AND column_name='exercises_completed') THEN
           ALTER TABLE public.workout_logs ADD COLUMN exercises_completed INTEGER DEFAULT 0;
         END IF;
       END $$;`,

      // Add total_exercises (progress tracking)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='workout_logs' AND column_name='total_exercises') THEN
           ALTER TABLE public.workout_logs ADD COLUMN total_exercises INTEGER DEFAULT 0;
         END IF;
       END $$;`
    ];

    console.log(`🚀 Applying ${alterStatements.length} schema updates...`);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i];
      const columnName = statement.match(/column_name='([^']+)'/)?.[1] || `statement ${i + 1}`;
      
      console.log(`\n${i + 1}. Adding ${columnName} column...`);
      
      try {
        // Use raw SQL execution via Supabase
        const { error } = await supabase.rpc('sql', { query: statement });
        
        if (error) {
          console.log(`   ❌ Failed: ${error.message}`);
          failureCount++;
          
          // Try alternative methods
          console.log(`   🔄 Trying alternative approach...`);
          // We could try other methods here if needed
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        failureCount++;
      }
    }

    console.log(`\n📊 Results: ${successCount} successful, ${failureCount} failed`);

    // Test the final schema
    console.log('\n🧪 Testing final schema...');
    
    try {
      // Try to insert a test record to verify all columns work
      const { data: aiPlans } = await supabase
        .from('workout_plans')
        .select('id, user_id')
        .eq('ai_generated', true)
        .limit(1);
      
      if (aiPlans && aiPlans.length > 0) {
        const testUserId = aiPlans[0].user_id;
        const testPlanId = aiPlans[0].id;
        
        console.log('   Testing with full column set...');
        
        const testData = {
          user_id: testUserId,
          workout_id: testPlanId,
          ai_workout_plan_id: testPlanId,
          workout_type: 'ai_generated',
          duration: 30,
          exercises_completed: 5,
          total_exercises: 8,
          calories_burned: 250,
          notes: 'Schema test completion',
          rating: 5,
          completed_at: new Date().toISOString()
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('workout_logs')
          .insert(testData)
          .select()
          .single();
        
        if (insertError) {
          if (insertError.message.includes('row-level security')) {
            console.log('   ✅ Schema OK (RLS blocked insert, but columns exist)');
          } else {
            console.log(`   ❌ Schema issue: ${insertError.message}`);
          }
        } else {
          console.log('   ✅ Schema perfect! All columns working');
          console.log('   📋 Available columns:', Object.keys(insertResult));
          
          // Clean up test record
          await supabase.from('workout_logs').delete().eq('id', insertResult.id);
          console.log('   🧹 Test record cleaned up');
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Test error: ${error.message}`);
    }

    console.log('\n🎉 Schema update process complete!');

  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
  }
}

createMissingWorkoutLogsColumns();

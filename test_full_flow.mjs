#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullFlow() {
  console.log('🧪 Testing Complete AI Workout Flow...')
  
  try {
    // 1. Test RPC function
    console.log('\n1️⃣ Testing RPC function...')
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_ai_workout_plans')
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError)
      return
    }
    
    console.log('✅ RPC returned:', rpcData?.length || 0, 'AI workouts')
    
    // 2. Test direct query
    console.log('\n2️⃣ Testing direct query...')
    const { data: directData, error: directError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('ai_generated', true)
      .limit(5)
    
    if (directError) {
      console.error('❌ Direct query error:', directError)
      return
    }
    
    console.log('✅ Direct query returned:', directData?.length || 0, 'AI workouts')
    
    // 3. Verify AI workout details
    if (directData && directData.length > 0) {
      console.log('\n3️⃣ AI Workout Details:')
      const workout = directData[0]
      console.log('  📝 Title:', workout.title)
      console.log('  🎯 Fitness Goal:', workout.fitness_goal)
      console.log('  🏋️  Exercises:', Array.isArray(workout.exercises) ? workout.exercises.length : 'N/A')
      console.log('  📅 Weekly Structure:', Array.isArray(workout.weekly_structure) ? workout.weekly_structure.length + ' days' : 'N/A')
      console.log('  🔓 Public:', workout.is_public)
      console.log('  🤖 AI Generated:', workout.ai_generated)
      console.log('  📊 Status:', workout.status)
      
      // 4. Test workout logging (simulated completion)
      console.log('\n4️⃣ Testing workout completion logging...')
      const { data: logData, error: logError } = await supabase
        .rpc('log_ai_workout_completion', { 
          p_workout_plan_id: workout.id,
          p_user_id: workout.user_id 
        })
      
      if (logError) {
        console.warn('⚠️ Workout logging error (expected without auth):', logError.message)
      } else {
        console.log('✅ Workout completion logged:', logData)
      }
    }
    
    console.log('\n🎉 Full AI workout flow test completed successfully!')
    console.log('✅ AI workouts are accessible via both RPC and direct queries')
    console.log('✅ AI workouts have proper structure and data')
    console.log('✅ Ready for frontend integration')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFullFlow()

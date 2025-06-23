#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFrontendAIWorkout() {
  console.log('🧪 Testing Frontend AI Workout Retrieval...')
  
  try {
    // Test the RPC function that the frontend would use
    console.log('📡 Calling get_ai_workout_plans RPC function...')
    const { data: aiWorkouts, error } = await supabase
      .rpc('get_ai_workout_plans')
    
    if (error) {
      console.error('❌ Error calling RPC function:', error)
      return
    }
    
    console.log('✅ Successfully retrieved AI workouts:', aiWorkouts?.length || 0)
    
    if (aiWorkouts && aiWorkouts.length > 0) {
      console.log('🎯 First AI workout:')
      const workout = aiWorkouts[0]
      console.log('  - ID:', workout.id)
      console.log('  - Title:', workout.title)
      console.log('  - Name:', workout.name)
      console.log('  - Description:', workout.description)
      console.log('  - Fitness Goal:', workout.fitness_goal)
      console.log('  - Exercises:', workout.exercises?.length || 0)
      console.log('  - Weekly Structure:', workout.weekly_structure?.length || 0)
      console.log('  - AI Generated:', workout.ai_generated)
      console.log('  - Status:', workout.status)
      console.log('  - Created:', workout.created_at)
      
      // Test direct query as well (what the frontend components might use)
      console.log('\n📊 Testing direct query...')
      const { data: directQuery, error: directError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
      
      if (directError) {
        console.error('❌ Error with direct query:', directError)
      } else {
        console.log('✅ Direct query returned:', directQuery?.length || 0, 'AI workouts')
      }
    } else {
      console.log('⚠️ No AI workouts found')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFrontendAIWorkout()

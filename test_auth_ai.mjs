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

async function testWithAuth() {
  console.log('🧪 Testing AI Workout Access with Authentication...')
  
  try {
    // First, let's test if we can sign in with the existing user
    console.log('🔐 Attempting to sign in...')
    
    // Try to sign in with a test email/password (this might fail, which is okay)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (authError) {
      console.log('⚠️ Authentication failed (expected):', authError.message)
      console.log('💡 Testing without authentication - AI workouts should still be accessible if RLS is correct')
    } else {
      console.log('✅ Authenticated as:', authData.user?.email)
    }
    
    // Test the RPC function
    console.log('\n📡 Testing RPC function...')
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_ai_workout_plans')
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError)
    } else {
      console.log('✅ RPC returned:', rpcData?.length || 0, 'AI workouts')
    }
    
    // Test direct query
    console.log('\n📊 Testing direct query...')
    const { data: directData, error: directError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('ai_generated', true)
    
    if (directError) {
      console.error('❌ Direct query error:', directError)
    } else {
      console.log('✅ Direct query returned:', directData?.length || 0, 'AI workouts')
    }
    
    // Test direct query with specific conditions
    console.log('\n🔍 Testing direct query with more specific conditions...')
    const { data: specificData, error: specificError } = await supabase
      .from('workout_plans')
      .select('id, title, ai_generated, is_public, user_id')
      .eq('ai_generated', true)
      .limit(5)
    
    if (specificError) {
      console.error('❌ Specific query error:', specificError)
    } else {
      console.log('✅ Specific query returned:', specificData?.length || 0, 'AI workouts')
      if (specificData && specificData.length > 0) {
        console.log('📋 Results:')
        specificData.forEach(item => {
          console.log(`  - ${item.title} (AI: ${item.ai_generated}, Public: ${item.is_public})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWithAuth()

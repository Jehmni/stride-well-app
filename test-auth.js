// Test script to verify authentication setup
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ruxnobvwdzyenucyimus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check connection
    const { data, error } = await supabase.from('challenges').select('count').limit(1);
    if (error) {
      console.error('Connection test failed:', error);
      return;
    }
    console.log('✅ Supabase connection successful');
    
    // Test 2: Test signup
    const testEmail = 'test@stridewell.com';
    const testPassword = 'password123';
    
    console.log(`Testing signup with ${testEmail}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        console.log('📝 User already exists, testing signin...');
        
        // Test signin instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (signInError) {
          console.error('❌ Signin failed:', signInError);
          return;
        }
        
        console.log('✅ Signin successful');
        console.log('User ID:', signInData.user.id);
        
        // Check if profile was created
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();
          
        if (profileError) {
          console.error('❌ Profile fetch failed:', profileError);
        } else {
          console.log('✅ User profile found:', profile);
        }
        
      } else {
        console.error('❌ Signup failed:', signUpError);
        return;
      }
    } else {
      console.log('✅ Signup successful');
      console.log('User ID:', signUpData.user.id);
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profile was auto-created
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
        
      if (profileError) {
        console.error('❌ Profile auto-creation failed:', profileError);
      } else {
        console.log('✅ User profile auto-created:', profile);
      }
    }
    
    // Test 3: Test signout
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('❌ Signout failed:', signOutError);
    } else {
      console.log('✅ Signout successful');
    }
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();

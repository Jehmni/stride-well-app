// Clear session and test login with the fixed database schema
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthAndProfile() {
  console.log("Testing authentication and profile access...");
  
  try {
    // First sign out any existing session
    await supabase.auth.signOut();
    console.log("✅ Signed out any existing session");
    
    // Sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "testuser1750627009104@stridewell.com",
      password: "TestPassword123!"
    });
    
    if (authError) {
      console.error("❌ Auth error:", authError.message);
      return;
    }
    
    console.log("✅ Authentication successful!");
    console.log("User ID:", authData.user?.id);
    
    // Test profile access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile error:", profileError.message);
      return;
    }
    
    console.log("✅ Profile access successful!");
    console.log("Profile data:", {
      id: profile.id,
      email: profile.email,
      age: profile.age,
      sex: profile.sex,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      fitness_goal: profile.fitness_goal,
      fitness_goals: profile.fitness_goals
    });
    
    // Test profile update
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        age: 26,
        sex: 'male',
        height: 176.0,
        weight: 71.0,
        fitness_goal: 'muscle-building'
      })
      .eq('id', authData.user?.id)
      .select();
    
    if (updateError) {
      console.error("❌ Update error:", updateError.message);
      return;
    }
    
    console.log("✅ Profile update successful!");
    console.log("Updated profile:", updateData[0]);
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testAuthAndProfile();

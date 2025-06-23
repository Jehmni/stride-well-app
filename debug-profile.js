// Debug user profile issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugUserProfile() {
  console.log("Debugging user profile issues...");
  
  try {
    // First login with our test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "testuser1750627009104@stridewell.com",
      password: "TestPassword123!"
    });
    
    if (authError) {
      console.error("❌ Login failed:", authError.message);
      return;
    }
    
    console.log("✅ Login successful");
    console.log("User ID:", authData.user.id);
    
    // Check if user profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile fetch error:", profileError);
      
      // If profile doesn't exist, let's create it
      if (profileError.code === 'PGRST116') {
        console.log("Profile doesn't exist, creating one...");
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || "Test User"
          })
          .select()
          .single();
        
        if (createError) {
          console.error("❌ Failed to create profile:", createError);
        } else {
          console.log("✅ Profile created:", newProfile);
        }
      }
    } else {
      console.log("✅ Profile found:", profileData);
    }
    
    // Test updating profile
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        gender: 'male',
        height: 180,
        weight: 75,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)
      .select();
    
    if (updateError) {
      console.error("❌ Profile update error:", updateError);
    } else {
      console.log("✅ Profile updated successfully:", updateData);
    }
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

debugUserProfile();

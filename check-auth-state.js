// Test authentication state and clear any cached data
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCurrentAuth() {
  console.log("Checking current authentication state...");
  
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      return;
    }
    
    if (sessionData.session) {
      console.log("✅ Current session found");
      console.log("User ID:", sessionData.session.user.id);
      console.log("Email:", sessionData.session.user.email);
      
      // Check if profile exists for this user
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', sessionData.session.user.id);
      
      if (profileError) {
        console.error("❌ Profile check error:", profileError);
      } else if (profileData.length === 0) {
        console.log("⚠️ No profile found for this user");
      } else {
        console.log("✅ Profile found:", profileData[0]);
      }
    } else {
      console.log("ℹ️ No current session");
    }
    
    // Also check for the problematic user ID
    const problematicUserId = "aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97";
    console.log(`\nChecking for problematic user ID: ${problematicUserId}`);
    
    const { data: problemData, error: problemError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', problematicUserId);
    
    if (problemError) {
      console.error("❌ Error checking problematic user:", problemError);
    } else if (problemData.length === 0) {
      console.log("ℹ️ Problematic user ID not found in database (this is expected)");
    } else {
      console.log("⚠️ Problematic user found:", problemData[0]);
    }
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

checkCurrentAuth();

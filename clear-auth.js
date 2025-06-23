// Force sign out and clear all cached auth data
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearAuthAndLogin() {
  console.log("Clearing authentication and starting fresh...");
  
  try {
    // Force sign out
    await supabase.auth.signOut();
    console.log("✅ Signed out successfully");
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Sign in with fresh credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "testuser1750627009104@stridewell.com",
      password: "TestPassword123!"
    });
    
    if (error) {
      console.error("❌ Login failed:", error.message);
    } else {
      console.log("✅ Fresh login successful!");
      console.log("User ID:", data.user.id);
      console.log("Email:", data.user.email);
      
      console.log("\n🎯 NEXT STEPS:");
      console.log("1. Clear browser data as described above");
      console.log("2. Refresh the page (Ctrl+F5)");
      console.log("3. Login with these credentials:");
      console.log("   Email: testuser1750627009104@stridewell.com");
      console.log("   Password: TestPassword123!");
    }
    
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

clearAuthAndLogin();

// Create a new test user for testing
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createNewTestUser() {
  console.log("Creating a fresh test user...");
  
  const testEmail = `testuser${Date.now()}@stridewell.com`;
  const testPassword = "TestPassword123!";
  
  try {
    // Create new user account
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: "Test User New"
        }
      }
    });
    
    if (error) {
      console.error("❌ Signup error:", error.message);
    } else {
      console.log("✅ Signup successful!");
      console.log("New Test Email:", testEmail);
      console.log("Password:", testPassword);
      console.log("User confirmed:", !!data.user?.email_confirmed_at);
      
      if (data.user?.email_confirmed_at) {
        console.log("🎉 Email confirmation is disabled! User is ready to login.");
      } else {
        console.log("⚠️ Email confirmation still required. Check Supabase dashboard settings.");
      }
    }
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

createNewTestUser();

// Test script to create a verified test user account
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
  console.log("Creating test user account...");
  
  const testEmail = "test@stridewell.com";
  const testPassword = "TestPassword123!";
  
  try {
    // Try to sign up the test user
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: "Test User"
        }
      }
    });
    
    if (error) {
      console.error("❌ Signup error:", error.message);
      
      // If user already exists, try to sign in
      if (error.message.includes("already registered")) {
        console.log("User already exists, trying to sign in...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (signInError) {
          console.error("❌ Sign in error:", signInError.message);
          if (signInError.message.includes("Email not confirmed")) {
            console.log("\n⚠️  EMAIL CONFIRMATION REQUIRED");
            console.log("Please disable email confirmation in Supabase dashboard:");
            console.log("1. Go to: https://supabase.com/dashboard/project/ruxnobvwdzyenucyimus");
            console.log("2. Navigate to Authentication > Settings");
            console.log("3. Disable 'Email Confirmation'");
            console.log("4. Save changes");
          }
        } else {
          console.log("✅ Sign in successful!");
          console.log("User:", signInData.user?.email);
        }
      }
    } else {
      console.log("✅ Signup successful!");
      console.log("User:", data.user?.email);
      console.log("Confirmation required:", !data.user?.email_confirmed_at);
      
      if (!data.user?.email_confirmed_at) {
        console.log("\n⚠️  EMAIL CONFIRMATION REQUIRED");
        console.log("Please disable email confirmation in Supabase dashboard:");
        console.log("1. Go to: https://supabase.com/dashboard/project/ruxnobvwdzyenucyimus");
        console.log("2. Navigate to Authentication > Settings");
        console.log("3. Disable 'Email Confirmation'");
        console.log("4. Save changes");
      }
    }
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

// Test credentials for login
console.log("\n📝 TEST CREDENTIALS:");
console.log("Email: test@stridewell.com");
console.log("Password: TestPassword123!");
console.log("\nRunning test...\n");

createTestUser();

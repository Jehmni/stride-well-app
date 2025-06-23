// Quick login test after disabling email confirmation
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoginAfterFix() {
  console.log("Testing login after disabling email confirmation...");
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@stridewell.com",
      password: "TestPassword123!"
    });
    
    if (error) {
      console.error("❌ Login failed:", error.message);
    } else {
      console.log("✅ Login successful!");
      console.log("User:", data.user?.email);
      console.log("Session:", data.session ? "Active" : "None");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testLoginAfterFix();

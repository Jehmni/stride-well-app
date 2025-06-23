// Quick test to verify Supabase configuration
import { createClient } from '@supabase/supabase-js';

// Test with environment variables (simulating browser environment)
const SUPABASE_URL = "https://ruxnobvwdzyenucyimus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk";

console.log("Testing Supabase configuration...");
console.log("URL:", SUPABASE_URL);
console.log("Key prefix:", SUPABASE_ANON_KEY.substring(0, 20) + "...");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test basic connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('exercises').select('count').limit(1);
    if (error) {
      console.error("Connection test failed:", error);
    } else {
      console.log("✅ Connection test successful!");
      console.log("Data received:", data);
    }
  } catch (err) {
    console.error("❌ Connection error:", err);
  }
}

testConnection();

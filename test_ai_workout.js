// Test script to verify the AI workout feature
const testAIWorkout = async () => {
  console.log("🔄 Testing AI Workout Feature...");
  
  // Test 1: Check if AI config is available
  console.log("1. Checking AI configuration...");
  try {
    const response = await fetch('/api/ai-config');
    if (response.ok) {
      console.log("✅ AI configuration endpoint available");
    } else {
      console.log("❌ AI configuration endpoint not available");
    }
  } catch (error) {
    console.log("⚠️ AI configuration check failed:", error);
  }
  
  // Test 2: Check if AI proxy or OpenAI API key is available
  console.log("2. Checking AI configuration (proxy or direct key)...");
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (proxyUrl) {
    console.log("✅ AI proxy configured at", proxyUrl);
  } else if (apiKey && apiKey.startsWith('sk-')) {
    console.log("✅ OpenAI API key is present (development fallback)");
  } else {
    console.log("❌ Neither AI proxy nor OpenAI API key is configured");
  }
  
  // Test 3: Check if Supabase connection is working
  console.log("3. Checking Supabase connection...");
  try {
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact' });
    if (!error) {
      console.log("✅ Supabase connection is working");
    } else {
      console.log("❌ Supabase connection error:", error);
    }
  } catch (error) {
    console.log("⚠️ Supabase connection check failed:", error);
  }
  
  // Test 4: Check if workout_plans table structure is correct
  console.log("4. Checking workout_plans table structure...");
  try {
    const { data, error } = await supabase.from('workout_plans').select('*').limit(1);
    if (!error) {
      console.log("✅ workout_plans table is accessible");
      if (data && data.length > 0) {
        console.log("📊 Table columns:", Object.keys(data[0]));
      }
    } else {
      console.log("❌ workout_plans table error:", error);
    }
  } catch (error) {
    console.log("⚠️ workout_plans table check failed:", error);
  }
  
  console.log("✅ AI Workout feature test completed!");
};

// Run the test
testAIWorkout();

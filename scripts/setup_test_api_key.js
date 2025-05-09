const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// This script sets up a test API key for OpenAI in the ai_configurations table

const setup = async () => {
  try {
    console.log("Setting up test API key for AI workout generation...");
    
    // Check if .env exists and contains SUPABASE_URL and SUPABASE_KEY
    const envPath = path.resolve('.env');
    let supabaseUrl, supabaseKey, apiKey;
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Extract values from .env file
      const extractValue = (key) => {
        const match = envContent.match(new RegExp(`${key}=([^\n]+)`));
        return match ? match[1] : null;
      };
      
      supabaseUrl = extractValue('VITE_SUPABASE_URL');
      supabaseKey = extractValue('VITE_SUPABASE_ANON_KEY');
      apiKey = extractValue('VITE_OPENAI_API_KEY') || 'sk-example-api-key-for-testing';
      
      if (!supabaseUrl || !supabaseKey) {
        console.log("Supabase credentials not found in .env file");
        process.exit(1);
      }
    } else {
      console.log(".env file not found");
      process.exit(1);
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if the ai_configurations table exists
    console.log("Checking if ai_configurations table exists...");
    const { error: tableCheckError } = await supabase
      .from('ai_configurations')
      .select('id')
      .limit(1);
      
    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      console.log("The ai_configurations table doesn't exist. Creating it...");
      
      // Execute SQL to create the table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.ai_configurations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            service_name TEXT NOT NULL,
            api_key TEXT,
            api_endpoint TEXT,
            model_name TEXT,
            is_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Add example configuration
          INSERT INTO public.ai_configurations (service_name, api_endpoint, model_name, is_enabled)
          VALUES ('openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', FALSE)
          ON CONFLICT DO NOTHING;
        `
      });
      
      if (createError) {
        console.error("Error creating table:", createError);
        process.exit(1);
      }
    }
    
    // Update the OpenAI API key in the ai_configurations table
    console.log("Setting test API key...");
    const { error: updateError } = await supabase
      .from('ai_configurations')
      .update({
        api_key: apiKey,
        is_enabled: true
      })
      .eq('service_name', 'openai');
      
    if (updateError) {
      console.error("Error updating API key:", updateError);
      process.exit(1);
    }
    
    console.log("✅ Test API key set successfully!");
    console.log("You can now use AI-generated workouts in the app");
    
  } catch (error) {
    console.error("Error setting up test API key:", error);
    process.exit(1);
  }
};

setup();

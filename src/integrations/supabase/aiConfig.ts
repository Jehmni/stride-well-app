import { supabase } from "./client";

/**
 * Interface for AI configuration
 */
export interface AIConfig {
  service_name: string;
  api_key?: string;
  api_endpoint: string;
  model_name: string;
  is_enabled: boolean;
}

/**
 * Get AI configuration from environment variables or database
 * @param serviceName Name of the AI service (e.g., 'openai')
 * @returns AI configuration object
 */
export const getAIConfig = async (serviceName: string = 'openai'): Promise<AIConfig | null> => {
  try {
    // First check environment variables (which take precedence)
    const apiKey = process.env.VITE_OPENAI_API_KEY;
    const apiEndpoint = process.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const modelName = process.env.VITE_OPENAI_MODEL || "gpt-4o";
    
    if (apiKey) {
      // If we have environment variables, use those
      return {
        service_name: serviceName,
        api_key: apiKey,
        api_endpoint: apiEndpoint,
        model_name: modelName,
        is_enabled: true
      };
    }
    
    // Otherwise, check if we have a service role key to access the config table
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = supabase.auth.admin;
      
      if (adminClient) {
        // Try to get config from database
        const { data, error } = await supabase
          .from('ai_configurations')
          .select('*')
          .eq('service_name', serviceName)
          .eq('is_enabled', true)
          .single();
          
        if (error) {
          console.error("Error fetching AI configuration:", error);
          return null;
        }
        
        return data as AIConfig;
      }
    }
    
    // If we couldn't get config from environment or database
    return null;
  } catch (error) {
    console.error("Error getting AI configuration:", error);
    return null;
  }
};

import { supabase } from "./client";

/**
 * Get the configuration for an AI service
 * @param serviceName The name of the AI service (e.g., 'openai')
 * @returns The AI configuration or null if not found
 */
export const getAIConfig = async (serviceName: string) => {
  try {
    // Try to get from environment variables first
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const envApiUrl = import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const envModel = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o";
    
    // If environment variables are set, use those
    if (envApiKey) {
      return {
        service_name: serviceName,
        api_key: envApiKey,
        api_endpoint: envApiUrl,
        model_name: envModel,
        is_enabled: true
      };
    }
    
    // Otherwise, get from database
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('service_name', serviceName)
      .single();
    
    if (error) {
      console.error(`Error fetching AI config for ${serviceName}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getAIConfig for ${serviceName}:`, error);
    return null;
  }
};

/**
 * Check if AI is available for use
 * @param serviceName The name of the AI service to check
 * @returns True if AI is available, false otherwise
 */
export const isAIAvailable = async (serviceName: string): Promise<boolean> => {
  const config = await getAIConfig(serviceName);
  return Boolean(config?.api_key && config?.is_enabled);
};

import { supabase } from "./client";

/**
 * Get the configuration for an AI service
 * @param serviceName The name of the AI service (e.g., 'openai')
 * @returns The AI configuration or null if not found
 */
export const getAIConfig = async (serviceName: string) => {
  try {
    // Prefer an AI proxy configuration (so the client doesn't need the OpenAI secret).
    const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
    const envApiUrl = import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const envModel = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o";

    if (proxyUrl) {
      return {
        service_name: serviceName,
        api_key: null,
        api_endpoint: proxyUrl,
        model_name: envModel,
        is_enabled: true
      };
    }

  // Otherwise, get from database
    
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
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  if (proxyUrl) return true;
  const config = await getAIConfig(serviceName);
  return Boolean(config?.api_key && config?.is_enabled);
};

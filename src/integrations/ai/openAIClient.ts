
import { supabase } from "@/integrations/supabase/client";
import { AIConfig } from "./aiConfig";

// OpenAI API response structure
interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
}

/**
 * OpenAI API client for making AI requests
 */
export class OpenAIClient {
  private apiEndpoint: string;
  private apiKey: string;
  private model: string;

  constructor(config: AIConfig) {
    this.apiEndpoint = config.api_endpoint;
    this.apiKey = config.api_key || '';
    this.model = config.model_name;
  }

  /**
   * Make a chat completion request to the OpenAI API
   * @param systemPrompt The system prompt to guide the AI
   * @param userPrompt The user prompt containing the specific request
   * @param temperature Temperature setting for creativity (0-1)
   * @returns The API response or null if failed
   */
  async createChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7
  ): Promise<OpenAIResponse | null> {
    try {
      // Validate API key
      if (!this.apiKey) {
        console.error("OpenAI API key is missing");
        return null;
      }

      // Make the API request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          temperature: temperature,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error (${response.status}):`, errorText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error making OpenAI API request:", error);
      return null;
    }
  }
}

/**
 * Create an OpenAI client from AI configuration
 * @param config The AI configuration object
 * @returns An OpenAI client instance or null if invalid config
 */
export const createOpenAIClient = (config: AIConfig | null): OpenAIClient | null => {
  if (!config || !config.api_key || !config.is_enabled) {
    return null;
  }
  
  return new OpenAIClient(config);
};

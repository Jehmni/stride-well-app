import { supabase } from "@/integrations/supabase/client";
import { AIConfig } from "./aiConfig";

// OpenAI API response structure
export interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
}

/**
 * OpenAI API client for making AI requests
 */
import { getMockWorkoutData } from "./mockWorkoutData";

export class OpenAIClient {
  private apiEndpoint: string;
  private apiKey: string;
  private model: string;
  private userInfo: any = null; // Store user info for mock responses

  constructor(config: AIConfig) {
    this.apiEndpoint = config.api_endpoint;
    this.apiKey = config.api_key || '';
    this.model = config.model_name;
  }
  
  /**
   * Set user info for generating appropriate mock responses
   */
  setUserInfo(userInfo: any) {
    this.userInfo = userInfo;
    return this;
  }

  /**
   * Make a chat completion request to the OpenAI API
   * @param systemPrompt The system prompt to guide the AI
   * @param userPrompt The user prompt containing the specific request
   * @param temperature Temperature setting for creativity (0-1)
   * @returns The API response or null if failed
   */  async createChatCompletion(systemPrompt: string, userPrompt: string): Promise<OpenAIResponse | null> {
    // Ensure we have an API key - throw error if not configured
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    try {
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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error (${response.status}):`, errorText);
        throw new Error(`OpenAI API returned error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  }
}

/**
 * Create an OpenAI client from AI configuration
 * @param config The AI configuration object
 * @returns An OpenAI client instance (always returns a client, even with mock data)
 */
export const createOpenAIClient = (config: AIConfig | null): OpenAIClient => {
  if (!config) {
    throw new Error("AI configuration is missing");
  }
  
  return new OpenAIClient(config);
};

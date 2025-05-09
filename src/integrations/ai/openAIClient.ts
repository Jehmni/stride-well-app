
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
  }
  
  /**
   * Create a mock response when API key is not available
   * @returns A simulated OpenAI API response
   */  private createMockResponse(): OpenAIResponse {
    // Default to general fitness if no user info is available
    const fitnessGoal = this.userInfo?.fitness_goal || 'general-fitness';
    
    // Get mock workout data based on the fitness goal
    const mockData = getMockWorkoutData(fitnessGoal);
    
    // Format as if it was an OpenAI response
    return {
      id: `mock-${Date.now()}`,
      choices: [
        {
          message: {
            content: JSON.stringify(mockData),
            role: 'assistant'
          },
          finish_reason: 'stop'
        }
      ]
    };
    
    // Create a response in the format expected from OpenAI
    return {
      id: `mock-${Date.now()}`,
      choices: [
        {
          message: {
            content: JSON.stringify(mockData),
            role: "assistant"
          },
          finish_reason: "stop"
        }
      ]
    };
  }

  /**
   * Make a chat completion request to the OpenAI API
   * @param systemPrompt The system prompt to guide the AI
   * @param userPrompt The user prompt containing the specific request
   * @param temperature Temperature setting for creativity (0-1)
   * @returns The API response or null if failed
   */  async createChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7
  ): Promise<OpenAIResponse | null> {
    try {
      // Validate API key
      if (!this.apiKey || this.apiKey === 'sk-example-api-key-for-testing') {
        console.warn("OpenAI API key is missing or using test key. Returning mock response.");
        return this.createMockResponse();
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
 * @returns An OpenAI client instance (always returns a client, even with mock data)
 */
export const createOpenAIClient = (config: AIConfig | null): OpenAIClient => {
  // If config is null or api_key is missing, create a default config for mock responses
  if (!config || !config.api_key) {
    const mockConfig: AIConfig = {
      service_name: 'openai',
      api_key: 'sk-example-api-key-for-testing',
      api_endpoint: 'https://api.openai.com/v1/chat/completions',
      model_name: 'gpt-4o',
      is_enabled: true
    };
    console.log("Using mock OpenAI client due to missing configuration");
    return new OpenAIClient(mockConfig);
  }
  
  return new OpenAIClient(config);
};

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
    // Always use the standard OpenAI endpoint
    this.apiEndpoint = "https://api.openai.com/v1/chat/completions";
    this.apiKey = config.api_key || import.meta.env.VITE_OPENAI_API_KEY || '';
    this.model = "gpt-3.5-turbo"; // Use reliable model
    
    console.log("OpenAI Client initialized:");
    console.log("- Endpoint:", this.apiEndpoint);
    console.log("- API Key length:", this.apiKey.length);
    console.log("- Model:", this.model);
    
    // Check if API key is properly configured
    if (!this.apiKey || this.apiKey.length < 10 || this.apiKey.startsWith('sk-example')) {
      console.warn('OpenAI API key not properly configured. AI features will use fallback responses.');
    }
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
    // Check if API key is properly configured
    if (!this.apiKey || this.apiKey.length < 10 || this.apiKey.startsWith('sk-example')) {
      console.warn("OpenAI API key not properly configured. Using fallback mock response.");
      // Return a mock response for development/demo purposes
      return this.generateMockResponse(userPrompt);
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
        console.warn("Falling back to mock response due to API error.");
        return this.generateMockResponse(userPrompt);
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      console.warn("Falling back to mock response due to network error.");
      return this.generateMockResponse(userPrompt);
    }
  }

  /**
   * Generate a mock response for development/demo purposes
   */
  private generateMockResponse(userPrompt: string): OpenAIResponse {
    const mockWorkout = getMockWorkoutData("general-fitness");
    
    return {
      id: `mock-${Date.now()}`,
      choices: [{
        message: {
          content: JSON.stringify(mockWorkout),
          role: "assistant"
        },
        finish_reason: "stop"
      }]
    };
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

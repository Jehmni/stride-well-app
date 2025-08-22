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
  private proxyUrl: string | null = null;

  constructor(config: AIConfig) {
  // Prefer the AI proxy when configured. This ensures the OpenAI key stays server-side.
  this.proxyUrl = import.meta.env.VITE_AI_PROXY_URL || null;
  this.apiEndpoint = this.proxyUrl ? `${this.proxyUrl.replace(/\/$/, '')}/api/ai` : "https://api.openai.com/v1/chat/completions";

  // The client should not have the OpenAI secret. We do not read VITE_OPENAI_API_KEY in source to avoid leaking keys.
  this.apiKey = config.api_key || '';
  this.model = import.meta.env.VITE_OPENAI_MODEL || config.model_name || "gpt-4o"; // Use model from env or config
    
    console.log("OpenAI Client initialized:");
    console.log("- Endpoint:", this.apiEndpoint);
    console.log("- API Key length:", this.apiKey.length);
    console.log("- Model:", this.model);
    
    // If no server-side proxy and no API key is available, we'll fall back to mock responses.
    if (!this.proxyUrl && (!this.apiKey || this.apiKey.length < 10)) {
      console.warn('No AI proxy configured and no API key provided. AI features will use fallback responses.');
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
  // If we have a proxy URL configured, call the proxy endpoint which handles server-side OpenAI requests.
  if (this.proxyUrl) {
      try {
    const response = await fetch(`${this.apiEndpoint}/meal-plan/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If the client needs to include a lightweight key, it may be provided via VITE_AI_PROXY_KEY
      ...(import.meta.env.VITE_AI_PROXY_KEY ? { 'X-AI-PROXY-KEY': import.meta.env.VITE_AI_PROXY_KEY } : {})
          },
          body: JSON.stringify({ systemPrompt, userPrompt })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI proxy error (${response.status}):`, errorText);
          console.warn("Falling back to mock response due to proxy error.");
          return this.generateMockResponse(userPrompt);
        }

        const json = await response.json();
        // The proxy returns the OpenAI-like payload at json.raw or the parsed object at json.parsed
        return json.raw || json;
      } catch (error) {
        console.error("Error calling AI proxy:", error);
        console.warn("Falling back to mock response due to network error.");
        return this.generateMockResponse(userPrompt);
      }
    }

  // No proxy configured — fall back to calling OpenAI directly (dev only)
  if (!this.apiKey || this.apiKey.length < 10) {
      console.warn("OpenAI API key not properly configured. Using fallback mock response.");
      return this.generateMockResponse(userPrompt);
    }

    try {
      // Make the API request directly to OpenAI (developer fallback)
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

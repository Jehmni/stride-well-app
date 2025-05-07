
/**
 * Configuration interface for AI services
 */
export interface AIConfig {
  service_name: string;
  api_key: string | null;
  api_endpoint: string;
  model_name: string;
  is_enabled: boolean;
}

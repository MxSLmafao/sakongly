export interface Provider {
  id: string;
  name: string;
  curl_template: string;
  response_path: string;
  streaming: boolean;
  api_key: string;
  model: string;
  system_prompt: string;
  is_preset: boolean;
}

import type { Provider } from "./types";

export const PROVIDER_PRESETS: Omit<Provider, "id" | "api_key">[] = [
  {
    name: "Ollama (local)",
    curl_template: `curl -s -N http://localhost:11434/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"model":"{{MODEL}}","messages":[{"role":"system","content":"{{SYSTEM_PROMPT}}"},{"role":"user","content":"{{TEXT}}"}],"stream":true}'`,
    response_path: "message.content",
    streaming: true,
    model: "llama3.2",
    system_prompt: "You are a helpful assistant.",
    is_preset: true,
  },
  {
    name: "llama.cpp (local)",
    curl_template: `curl -s -N http://localhost:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"{{MODEL}}","messages":[{"role":"system","content":"{{SYSTEM_PROMPT}}"},{"role":"user","content":"{{TEXT}}"}],"stream":true}'`,
    response_path: "choices[0].delta.content",
    streaming: true,
    model: "default",
    system_prompt: "You are a helpful assistant.",
    is_preset: true,
  },
  {
    name: "DeepSeek",
    curl_template: `curl -s -N https://api.deepseek.com/chat/completions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"{{MODEL}}","messages":[{"role":"system","content":"{{SYSTEM_PROMPT}}"},{"role":"user","content":"{{TEXT}}"}],"stream":true}'`,
    response_path: "choices[0].delta.content",
    streaming: true,
    model: "deepseek-chat",
    system_prompt: "You are a helpful assistant.",
    is_preset: true,
  },
  {
    name: "AIMLAPI",
    curl_template: `curl -s -N https://api.aimlapi.com/v1/chat/completions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"{{MODEL}}","messages":[{"role":"system","content":"{{SYSTEM_PROMPT}}"},{"role":"user","content":"{{TEXT}}"}],"stream":true}'`,
    response_path: "choices[0].delta.content",
    streaming: true,
    model: "gpt-4o",
    system_prompt: "You are a helpful assistant.",
    is_preset: true,
  },
];

export interface Conversation {
  id: string;
  title: string;
  provider_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments_json: string | null;
  created_at: number;
}

export interface SystemPrompt {
  id: string;
  name: string;
  body: string;
  created_at: number;
}

export interface AttachmentInfo {
  path: string;
  name: string;
  mime: string;
  size: number;
  data_url: string | null;
}

export interface Attachment extends AttachmentInfo {}

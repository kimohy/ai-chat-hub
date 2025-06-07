export interface User {
  username: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ChatRequest {
  messages: Message[];
  provider: 'openai' | 'anthropic' | 'gemini';
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
}

export interface SystemStatus {
  status: string;
  version: string;
  config: {
    rate_limit: number;
    providers: {
      openai: boolean;
      anthropic: boolean;
      gemini: boolean;
    };
  };
} 
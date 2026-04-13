export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  hasError?: boolean;
}

export interface ChatSession {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type ModelId = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

export type AppTheme = 'dark' | 'light';

export interface AppSettings {
  model: ModelId;
  systemPrompt: string;
  theme: AppTheme;
}

/** Shape of a message sent to the OpenAI-compatible API route. */
export interface ApiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

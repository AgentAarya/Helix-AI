
export enum AppMode {
  CHAT = 'chat',
  VOICE = 'voice',
  IMAGE = 'image',
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'voice';
  imageUrl?: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export interface VoiceState {
  isActive: boolean;
  transcription: string;
  isModelSpeaking: boolean;
}

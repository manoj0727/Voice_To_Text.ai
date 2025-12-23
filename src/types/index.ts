export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface AudioState {
  isRecording: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

export interface DeepgramConfig {
  apiKey: string;
  model?: string;
  language?: string;
  punctuate?: boolean;
  interimResults?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AppError {
  type: 'permission' | 'network' | 'api' | 'audio' | 'unknown';
  message: string;
  details?: string;
}

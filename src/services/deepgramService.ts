/**
 * Deepgram Transcription Service
 * Handles WebSocket connection to Deepgram for real-time speech-to-text
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { LiveClient } from '@deepgram/sdk';
import { TranscriptionResult, ConnectionStatus, DeepgramConfig } from '../types';

type TranscriptionCallback = (result: TranscriptionResult) => void;
type StatusCallback = (status: ConnectionStatus) => void;
type ErrorCallback = (error: Error) => void;

export class DeepgramService {
  private connection: LiveClient | null = null;
  private config: DeepgramConfig;
  private onTranscription: TranscriptionCallback | null = null;
  private onStatusChange: StatusCallback | null = null;
  private onError: ErrorCallback | null = null;
  private keepAliveInterval: number | null = null;

  constructor(config: DeepgramConfig) {
    this.config = {
      model: 'nova-2',
      language: 'en',
      punctuate: true,
      interimResults: true,
      ...config,
    };
  }

  /**
   * Set the API key (useful for runtime configuration)
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Connect to Deepgram WebSocket API
   */
  async connect(
    onTranscription: TranscriptionCallback,
    onStatusChange: StatusCallback,
    onError: ErrorCallback
  ): Promise<void> {
    this.onTranscription = onTranscription;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    if (!this.config.apiKey) {
      onError(new Error('Deepgram API key is required'));
      onStatusChange('error');
      return;
    }

    // Clean up any existing connection before creating new one
    if (this.connection) {
      this.stopKeepAlive();
      try {
        this.connection.requestClose();
      } catch {
        // Ignore close errors
      }
      this.connection = null;
    }

    onStatusChange('connecting');

    return new Promise((resolve, reject) => {
      try {
        const deepgram = createClient(this.config.apiKey);

        this.connection = deepgram.listen.live({
          model: 'nova-2',
          language: this.config.language || 'en',
          punctuate: false,
          interim_results: true,
          smart_format: false,
          endpointing: 10,
          vad_events: true,
          no_delay: true,
        });

        // Wait for connection to be established before resolving
        this.connection.on(LiveTranscriptionEvents.Open, () => {
          console.log('Deepgram WebSocket connected');
          this.onStatusChange?.('connected');
          this.startKeepAlive();
          resolve();
        });

        this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            console.log('Transcript received:', transcript, 'isFinal:', data.is_final || data.speech_final);
            this.onTranscription?.({
              text: transcript,
              isFinal: data.is_final || data.speech_final || false,
              confidence: data.channel?.alternatives?.[0]?.confidence || 0,
              timestamp: Date.now(),
            });
          }
        });

        this.connection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error('Deepgram error:', error);
          this.connection = null;
          this.onError?.(new Error(error.message || 'Deepgram connection error'));
          this.onStatusChange?.('error');
          reject(error);
        });

        this.connection.on(LiveTranscriptionEvents.Close, () => {
          console.log('Deepgram WebSocket closed');
          this.stopKeepAlive();
          this.connection = null;
          this.onStatusChange?.('disconnected');
        });

      } catch (error) {
        this.connection = null;
        onError(error instanceof Error ? error : new Error('Failed to connect to Deepgram'));
        onStatusChange('error');
        reject(error);
      }
    });
  }

  /**
   * Send audio data to Deepgram
   */
  sendAudio(audioData: Blob): void {
    if (this.connection && this.isConnectionOpen()) {
      // Use sync-like pattern for faster sending
      audioData.arrayBuffer().then(buffer => {
        if (this.connection && this.isConnectionOpen()) {
          this.connection.send(buffer);
        } else {
          console.warn('Connection closed while sending audio');
        }
      });
    } else {
      console.warn('Cannot send audio: connection not open');
    }
  }

  /**
   * Check if WebSocket connection is actually open
   */
  private isConnectionOpen(): boolean {
    if (!this.connection) return false;
    try {
      const state = this.connection.getReadyState?.();
      // WebSocket.OPEN = 1, if getReadyState not available, assume open if connection exists
      return state === undefined || state === 1;
    } catch {
      return true; // If we can't check, assume it's open and let it fail naturally
    }
  }

  /**
   * Send keep-alive message to prevent connection timeout
   */
  private startKeepAlive(): void {
    this.keepAliveInterval = window.setInterval(() => {
      if (this.connection) {
        this.connection.keepAlive();
      }
    }, 8000);
  }

  /**
   * Stop keep-alive messages
   */
  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Disconnect from Deepgram
   */
  disconnect(): void {
    this.stopKeepAlive();

    if (this.connection) {
      this.connection.requestClose();
      this.connection = null;
    }

    this.onStatusChange?.('disconnected');
  }

  /**
   * Check if connected to Deepgram
   */
  isConnected(): boolean {
    return this.connection !== null && this.isConnectionOpen();
  }
}

// Factory function to create service instance
export function createDeepgramService(apiKey: string): DeepgramService {
  return new DeepgramService({ apiKey });
}

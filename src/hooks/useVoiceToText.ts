/**
 * useVoiceToText Hook
 * Main hook for managing voice-to-text functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { audioCaptureService, AudioLevelCallback } from '../services/audioCapture';
import { DeepgramService, createDeepgramService } from '../services/deepgramService';
import { TranscriptionResult, ConnectionStatus, AppError } from '../types';

interface UseVoiceToTextOptions {
  apiKey: string;
  onTranscription?: (result: TranscriptionResult) => void;
  onAudioLevel?: AudioLevelCallback;
}

interface UseVoiceToTextReturn {
  isRecording: boolean;
  isPushToTalkActive: boolean;
  connectionStatus: ConnectionStatus;
  error: AppError | null;
  currentTranscript: string;
  finalTranscript: string;
  hasPermission: boolean | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  startPushToTalk: () => Promise<void>;
  stopPushToTalk: () => void;
  clearTranscript: () => void;
  clearError: () => void;
  requestPermission: () => Promise<boolean>;
}

export function useVoiceToText({ apiKey, onTranscription, onAudioLevel }: UseVoiceToTextOptions): UseVoiceToTextReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<AppError | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const deepgramRef = useRef<DeepgramService | null>(null);
  const isConnectedRef = useRef(false);

  // Initialize Deepgram service
  useEffect(() => {
    if (apiKey) {
      deepgramRef.current = createDeepgramService(apiKey);
    }
    return () => {
      deepgramRef.current?.disconnect();
      isConnectedRef.current = false;
    };
  }, [apiKey]);

  // Check permission on mount
  useEffect(() => {
    audioCaptureService.checkPermission().then(setHasPermission);
  }, []);

  // Handle transcription results - optimized for speed
  const handleTranscription = useCallback((result: TranscriptionResult) => {
    if (result.isFinal) {
      // Batch state updates using functional updates
      setFinalTranscript(prev => prev ? `${prev} ${result.text}`.trim() : result.text);
      setCurrentTranscript('');
    } else {
      // Only update if text changed
      setCurrentTranscript(prev => prev !== result.text ? result.text : prev);
    }
    onTranscription?.(result);
  }, [onTranscription]);

  // Handle connection status changes
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    if (status === 'error') {
      setIsRecording(false);
      setIsPushToTalkActive(false);
    }
  }, []);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    const appError: AppError = {
      type: determineErrorType(err),
      message: err.message,
      details: err.stack,
    };
    setError(appError);
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await audioCaptureService.requestPermission();
      setHasPermission(granted);
      if (!granted) {
        setError({
          type: 'permission',
          message: 'Microphone permission denied. Please grant access in your browser or system settings.',
        });
      }
      return granted;
    } catch (err) {
      setError({
        type: 'permission',
        message: 'Failed to request microphone permission.',
        details: err instanceof Error ? err.message : undefined,
      });
      return false;
    }
  }, []);

  // Pre-connect to Deepgram when API key is available
  const preConnect = useCallback(async () => {
    if (!apiKey || !deepgramRef.current || isConnectedRef.current) return;

    try {
      await deepgramRef.current.connect(
        handleTranscription,
        handleStatusChange,
        handleError
      );
      isConnectedRef.current = true;
    } catch (err) {
      console.error('Pre-connect failed:', err);
    }
  }, [apiKey, handleTranscription, handleStatusChange, handleError]);

  // Pre-connect when API key becomes available
  useEffect(() => {
    if (apiKey && hasPermission !== false) {
      preConnect();
    }
  }, [apiKey, hasPermission, preConnect]);

  // Start recording (continuous mode)
  const startRecording = useCallback(async () => {
    if (!apiKey) {
      setError({
        type: 'api',
        message: 'Deepgram API key is required. Please configure your API key.',
      });
      return;
    }

    if (isRecording) return;

    setError(null);

    try {
      // Ensure we have permission
      if (hasPermission === false) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      // Connect to Deepgram if not already connected
      if (deepgramRef.current && !isConnectedRef.current) {
        await deepgramRef.current.connect(
          handleTranscription,
          handleStatusChange,
          handleError
        );
        isConnectedRef.current = true;
      }

      // Start audio capture immediately
      await audioCaptureService.startCapture(
        (audioData) => {
          deepgramRef.current?.sendAudio(audioData);
        },
        onAudioLevel
      );

      setIsRecording(true);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to start recording'));
    }
  }, [apiKey, isRecording, hasPermission, requestPermission, handleTranscription, handleStatusChange, handleError, onAudioLevel]);

  // Stop recording - keep connection alive for instant next start
  const stopRecording = useCallback(() => {
    audioCaptureService.stopCapture();
    // Don't disconnect - keep connection alive for zero-lag next start
    setIsRecording(false);
    setCurrentTranscript('');
  }, []);

  // Start push-to-talk
  const startPushToTalk = useCallback(async () => {
    setIsPushToTalkActive(true);
    setFinalTranscript(''); // Clear previous transcript for new PTT session
    await startRecording();
  }, [startRecording]);

  // Stop push-to-talk
  const stopPushToTalk = useCallback(() => {
    setIsPushToTalkActive(false);
    stopRecording();
  }, [stopRecording]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRecording,
    isPushToTalkActive,
    connectionStatus,
    error,
    currentTranscript,
    finalTranscript,
    hasPermission,
    startRecording,
    stopRecording,
    startPushToTalk,
    stopPushToTalk,
    clearTranscript,
    clearError,
    requestPermission,
  };
}

// Helper to determine error type
function determineErrorType(error: Error): AppError['type'] {
  const message = error.message.toLowerCase();
  if (message.includes('permission') || message.includes('denied')) return 'permission';
  if (message.includes('network') || message.includes('websocket') || message.includes('connection')) return 'network';
  if (message.includes('api') || message.includes('key')) return 'api';
  if (message.includes('audio') || message.includes('microphone')) return 'audio';
  return 'unknown';
}

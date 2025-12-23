/**
 * Voice to Text App - Main Component
 * A Wispr Flow clone using Tauri + Deepgram
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useVoiceToText } from './hooks/useVoiceToText';
import {
  RecordButton,
  TranscriptDisplay,
  StatusBar,
  ErrorMessage,
  ApiKeySettings,
} from './components';
import './App.css';

// Storage key for API key
const API_KEY_STORAGE = 'deepgram_api_key';

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioLevelRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowSettings(true);
    }
  }, []);

  // Optimized audio level callback - throttled updates
  const handleAudioLevel = useCallback((level: number) => {
    audioLevelRef.current = audioLevelRef.current * 0.5 + level * 0.5;
    // Throttle state updates using RAF
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setAudioLevel(audioLevelRef.current);
        rafRef.current = null;
      });
    }
  }, []);

  // Initialize voice-to-text hook
  const {
    isRecording,
    connectionStatus,
    error,
    currentTranscript,
    finalTranscript,
    hasPermission,
    startPushToTalk,
    stopPushToTalk,
    clearTranscript,
    clearError,
    requestPermission,
  } = useVoiceToText({ apiKey, onAudioLevel: handleAudioLevel });

  // Handle API key save
  const handleSaveApiKey = useCallback((key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key);
    setApiKey(key);
    setShowSettings(false);
  }, []);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const textToCopy = finalTranscript || currentTranscript;
    if (textToCopy) {
      try {
        await writeText(textToCopy);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback to web API
        try {
          await navigator.clipboard.writeText(textToCopy);
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy also failed:', fallbackErr);
        }
      }
    }
  }, [finalTranscript, currentTranscript]);

  // Handle clear transcript
  const handleClear = useCallback(() => {
    clearTranscript();
  }, [clearTranscript]);

  // Push-to-talk handlers
  const handleMouseDown = useCallback(() => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    startPushToTalk();
  }, [apiKey, startPushToTalk]);

  const handleMouseUp = useCallback(() => {
    stopPushToTalk();
  }, [stopPushToTalk]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  // Request permission on first interaction if needed
  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  // Spacebar toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !showSettings) {
        // Prevent spacebar from scrolling the page
        if (e.target === document.body || (e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
          if (!apiKey) {
            setShowSettings(true);
            return;
          }
          if (!isRecording && hasPermission !== false) {
            startPushToTalk();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !showSettings) {
        if (e.target === document.body || (e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
          if (isRecording) {
            stopPushToTalk();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [apiKey, isRecording, hasPermission, showSettings, startPushToTalk, stopPushToTalk]);

  // Show settings view
  if (showSettings) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Voice to Text</h1>
          <p>Powered by Deepgram</p>
        </header>
        <main className="app-main settings-view">
          <ApiKeySettings
            apiKey={apiKey}
            onSave={handleSaveApiKey}
            onCancel={apiKey ? () => setShowSettings(false) : undefined}
            isRequired={!apiKey}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Voice to Text</h1>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* Status Bar */}
        <StatusBar
          connectionStatus={connectionStatus}
          hasPermission={hasPermission}
        />

        {/* Error Display */}
        {error && (
          <ErrorMessage
            error={error}
            onDismiss={clearError}
            onRetry={error.type === 'permission' ? handleRequestPermission : undefined}
          />
        )}

        {/* Permission Request */}
        {hasPermission === false && !error && (
          <div className="permission-prompt">
            <p>Microphone access is required for voice transcription.</p>
            <button onClick={handleRequestPermission}>
              Grant Microphone Access
            </button>
          </div>
        )}

        {/* Transcript Display */}
        <TranscriptDisplay
          finalTranscript={finalTranscript}
          currentTranscript={currentTranscript}
          isRecording={isRecording}
          onCopy={handleCopy}
          onClear={handleClear}
        />

        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="copy-feedback">
            Copied to clipboard!
          </div>
        )}

        {/* Push-to-Talk Button */}
        <div className="record-section">
          <RecordButton
            isRecording={isRecording}
            isConnecting={connectionStatus === 'connecting'}
            disabled={hasPermission === false}
            audioLevel={audioLevel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          <p className="record-hint">
            {isRecording
              ? 'Listening... Release to stop'
              : 'Press and hold to start speaking'}
          </p>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="keyboard-hint">
          <span>Tip: You can also use the spacebar to toggle recording</span>
        </div>
      </main>

      <footer className="app-footer">
        <p>Voice to Text App - Wispr Flow Clone</p>
      </footer>
    </div>
  );
}

export default App;

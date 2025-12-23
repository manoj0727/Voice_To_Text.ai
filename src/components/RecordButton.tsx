/**
 * RecordButton Component
 * Push-to-talk button with visual feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import './RecordButton.css';

interface RecordButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  disabled?: boolean;
  audioLevel?: number;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

// Number of bars in the waveform
const BAR_COUNT = 20;

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isConnecting,
  disabled,
  audioLevel = 0,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
}) => {
  // Store history of audio levels for waveform effect
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const barsRef = useRef<number[]>(Array(BAR_COUNT).fill(0));

  // Update bars when audio level changes
  useEffect(() => {
    if (isRecording) {
      // Shift bars left and add new level on the right
      barsRef.current = [...barsRef.current.slice(1), audioLevel];
      setBars([...barsRef.current]);
    } else if (barsRef.current.some(b => b > 0)) {
      // Reset bars when not recording
      barsRef.current = Array(BAR_COUNT).fill(0);
      setBars(Array(BAR_COUNT).fill(0));
    }
  }, [audioLevel, isRecording]);
  const getButtonClass = () => {
    let className = 'record-button';
    if (isRecording) className += ' recording';
    if (isConnecting) className += ' connecting';
    if (disabled) className += ' disabled';
    return className;
  };

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <div className="button-content">
          <div className="spinner" />
          <span>Connecting...</span>
        </div>
      );
    }

    if (isRecording) {
      // Scale the audio level ring based on voice input
      const ringScale = 1 + audioLevel * 0.8;
      const ringOpacity = 0.3 + audioLevel * 0.5;

      return (
        <div className="button-content">
          <div className="recording-indicator">
            <div
              className="audio-level-ring"
              style={{
                transform: `scale(${ringScale})`,
                opacity: ringOpacity,
              }}
            />
            <div className="pulse-ring" />
            <div className="mic-icon recording" />
          </div>
          {/* Waveform/Spike Graph */}
          <div className="waveform-container">
            {bars.map((level, index) => (
              <div
                key={index}
                className="waveform-bar"
                style={{
                  height: `${Math.max(3, level * 32)}px`,
                }}
              />
            ))}
          </div>
          <span>Release to Stop</span>
        </div>
      );
    }

    return (
      <div className="button-content">
        <div className="mic-icon" />
        <span>Hold to Talk</span>
      </div>
    );
  };

  return (
    <button
      className={getButtonClass()}
      onMouseDown={disabled ? undefined : onMouseDown}
      onMouseUp={disabled ? undefined : onMouseUp}
      onMouseLeave={isRecording ? onMouseUp : undefined}
      onTouchStart={disabled ? undefined : onTouchStart}
      onTouchEnd={disabled ? undefined : onTouchEnd}
      disabled={disabled}
      aria-label={isRecording ? 'Release to stop recording' : 'Hold to start recording'}
    >
      {getButtonContent()}
    </button>
  );
};

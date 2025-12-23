/**
 * TranscriptDisplay Component
 * Shows transcribed text with copy/clear functionality
 */

import React, { useRef, useEffect } from 'react';
import './TranscriptDisplay.css';

interface TranscriptDisplayProps {
  finalTranscript: string;
  currentTranscript: string;
  isRecording: boolean;
  onCopy: () => void;
  onClear: () => void;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  finalTranscript,
  currentTranscript,
  isRecording,
  onCopy,
  onClear,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasContent = finalTranscript || currentTranscript;

  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [finalTranscript, currentTranscript]);

  return (
    <div className="transcript-container">
      <div className="transcript-header">
        <h3>Transcript</h3>
        {hasContent && (
          <div className="transcript-actions">
            <button className="action-btn" onClick={onCopy} title="Copy to clipboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Copy
            </button>
            <button className="action-btn" onClick={onClear} title="Clear transcript">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="transcript-content" ref={containerRef}>
        {!hasContent && !isRecording && (
          <div className="placeholder">
            <p>Your transcribed text will appear here...</p>
            <p className="hint">Hold the microphone button and speak</p>
          </div>
        )}

        {hasContent && (
          <div className="transcript-text">
            {finalTranscript && <span className="final">{finalTranscript}</span>}
            {currentTranscript && (
              <span className="interim"> {currentTranscript}</span>
            )}
          </div>
        )}

        {isRecording && !currentTranscript && !finalTranscript && (
          <div className="listening">
            <div className="listening-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Listening...</p>
          </div>
        )}
      </div>
    </div>
  );
};

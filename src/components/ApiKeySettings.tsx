/**
 * ApiKeySettings Component
 * Allows users to configure their Deepgram API key
 */

import React, { useState } from 'react';
import './ApiKeySettings.css';

interface ApiKeySettingsProps {
  apiKey: string;
  onSave: (key: string) => void;
  onCancel?: () => void;
  isRequired?: boolean;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  apiKey,
  onSave,
  onCancel,
  isRequired = false,
}) => {
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="api-key-settings">
      <div className="settings-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
        <h3>Deepgram API Key</h3>
      </div>

      <p className="settings-description">
        Enter your Deepgram API key to enable speech-to-text transcription.
        Get your free API key at{' '}
        <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer">
          console.deepgram.com
        </a>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your Deepgram API key..."
            autoFocus
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            )}
          </button>
        </div>

        <div className="button-group">
          {onCancel && !isRequired && (
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="save-btn" disabled={!key.trim()}>
            {apiKey ? 'Update Key' : 'Save Key'}
          </button>
        </div>
      </form>

      <p className="security-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
        </svg>
        Your API key is stored locally and never shared.
      </p>
    </div>
  );
};

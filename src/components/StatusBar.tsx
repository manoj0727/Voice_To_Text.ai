/**
 * StatusBar Component
 * Shows connection status and other indicators
 */

import React from 'react';
import { ConnectionStatus } from '../types';
import './StatusBar.css';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  hasPermission: boolean | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  connectionStatus,
  hasPermission,
}) => {
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'Connected', className: 'connected' };
      case 'connecting':
        return { text: 'Connecting...', className: 'connecting' };
      case 'error':
        return { text: 'Connection Error', className: 'error' };
      default:
        return { text: 'Ready', className: 'disconnected' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="status-bar">
      <div className={`status-indicator ${status.className}`}>
        <div className="status-dot" />
        <span>{status.text}</span>
      </div>

      {hasPermission === false && (
        <div className="permission-warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span>Microphone access required</span>
        </div>
      )}
    </div>
  );
};

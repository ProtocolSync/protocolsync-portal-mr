import React from 'react';
import { CBadge } from '@coreui/react';
import type { HelpMessage } from '../types';
import { HelpSourceCitation } from './HelpSourceCitation';

interface HelpMessageListProps {
  messages: HelpMessage[];
}

export const HelpMessageList: React.FC<HelpMessageListProps> = ({ messages }) => {
  return (
    <div className="help-message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`help-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
        >
          <div className="message-header">
            <CBadge color={message.role === 'user' ? 'primary' : 'info'}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </CBadge>
            <span className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="message-content">
            {message.isLoading ? (
              <div className="loading-indicator">
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Thinking...
              </div>
            ) : (
              <>
                <div className="message-text">{message.content}</div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="message-sources mt-3">
                    <small className="text-medium-emphasis d-block mb-2">
                      <strong>Sources:</strong>
                    </small>
                    <div className="sources-list">
                      {message.sources.map((source, index) => (
                        <HelpSourceCitation key={index} source={source} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata (for debugging/admin) */}
                {message.token_count && message.response_time_ms && (
                  <div className="message-metadata mt-2">
                    <small className="text-muted">
                      {message.token_count} tokens • {message.response_time_ms}ms
                    </small>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

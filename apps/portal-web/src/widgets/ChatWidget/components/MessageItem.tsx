import React from 'react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`message ${message.sender}`}>
      <div className="message-bubble">
        {message.isLoading ? (
          <div className="loading-indicator">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        ) : (
          message.text
        )}
      </div>
      {!message.isLoading && (
        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
      )}
    </div>
  );
};

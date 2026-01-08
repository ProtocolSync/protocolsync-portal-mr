import React, { useState, useEffect } from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CBadge } from '@coreui/react';
import type { ChatWidgetProps, Message } from '../types';
import { ChatApiService } from '../services/chatApi';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import '../styles/ChatWidget.css';

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiEndpoint,
  apiKey,
  authToken,
  userId,
  documentId,
  documentName,
  recordHash,
  placeholder = 'Ask about clinical research policies...',
  welcomeMessage = 'Hello! I\'m here to help you with policy questions. How can I assist you today?',
  containerClassName = '',
  theme = 'light',
  isModal = false,
  isOpen = false,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: welcomeMessage,
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset messages when modal opens
  useEffect(() => {
    if (isModal && isOpen) {
      setMessages([{
        id: '1',
        text: welcomeMessage,
        sender: 'assistant',
        timestamp: new Date(),
      }]);
      setError(null);
    }
  }, [isModal, isOpen, welcomeMessage]);

  const apiService = new ChatApiService(apiEndpoint, apiKey, authToken);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await apiService.sendMessage(text, userId, documentId, documentName);

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.answer,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'Failed to get response from the server.');
      }
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      setError('An unexpected error occurred. Please try again.');
      console.error('Error in handleSendMessage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for valid authentication token
  if (!authToken || authToken.trim() === '') {
    const accessDeniedContent = (
      <div className={`chat-widget ${theme} ${containerClassName}`}>
        {!isModal && (
          <>
            <div className="chat-header">Document Query Assistant</div>
            {documentName && (
              <div className="chat-subheader">{documentName}</div>
            )}
          </>
        )}
        <div className="access-denied-container">
          <div className="access-denied-icon">🔒</div>
          <h2 className="access-denied-title">Access Denied</h2>
          <p className="access-denied-message">
            Please log into the ProtocolSync Portal.
          </p>
        </div>
      </div>
    );

    if (isModal) {
      return (
        <CModal
          size="xl"
          visible={isOpen}
          onClose={onClose}
          backdrop="static"
          alignment="center"
        >
          <CModalHeader closeButton>
            <CModalTitle className="d-flex align-items-center gap-2">
              <CBadge color="warning" className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', fontSize: '16px', fontWeight: 'bold' }}>
                AI
              </CBadge>
              <div>
                <div className="fw-semibold">Document Query Assistant</div>
                {documentName && (
                  <small className="text-medium-emphasis">{documentName}</small>
                )}
              </div>
            </CModalTitle>
          </CModalHeader>
          <CModalBody className="p-0">
            {accessDeniedContent}
          </CModalBody>
        </CModal>
      );
    }
    
    return accessDeniedContent;
  }

  const chatContent = (
    <div className={`chat-widget ${theme} ${containerClassName}`}>
      {!isModal && (
        <>
          <div className="chat-header">Document Query Assistant</div>
          {documentName && (
            <div className="chat-subheader">{documentName}</div>
          )}
        </>
      )}
      <MessageList messages={messages} />
      {error && <div className="error-message">{error}</div>}
      <InputBox
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={placeholder}
      />
      {recordHash && (
        <div style={{
          padding: '8px 12px',
          fontSize: '0.7rem',
          color: '#6c757d',
          borderTop: '1px solid #dee2e6',
          backgroundColor: '#f8f9fa',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          <div style={{ fontSize: '0.65rem', marginBottom: '2px', fontFamily: 'system-ui' }}>
            Record Hash (21 CFR Part 11):
          </div>
          {recordHash}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <CModal
        size="xl"
        visible={isOpen}
        onClose={onClose}
        backdrop="static"
        alignment="center"
      >
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CBadge color="warning" className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', fontSize: '16px', fontWeight: 'bold' }}>
              AI
            </CBadge>
            <div>
              <div className="fw-semibold">Document Query Assistant</div>
              {documentName && (
                <small className="text-medium-emphasis">{documentName}</small>
              )}
            </div>
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-0">
          {chatContent}
        </CModalBody>
      </CModal>
    );
  }

  return chatContent;
};

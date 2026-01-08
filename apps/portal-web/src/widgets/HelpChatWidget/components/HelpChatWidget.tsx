import React, { useState, useEffect, useRef } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CBadge,
  CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLifeRing, cilPaperPlane } from '@coreui/icons';
import type { HelpChatWidgetProps, HelpMessage } from '../types';
import { HelpChatApiService } from '../services/helpChatApi';
import { HelpMessageList } from './HelpMessageList';
import { HelpEscalationModal } from './HelpEscalationModal';

const WELCOME_MESSAGE = `Hi! I'm your Protocol Sync Help Assistant. I can help you with:

• How to use Protocol Sync features
• Questions about protocol management
• Delegation and compliance workflows
• Site-specific protocol details

Ask me anything, or click "Contact Support" if you need to speak with a person.`;

const SESSION_STORAGE_KEY = 'protocolsync_help_conversation_id';

export const HelpChatWidget: React.FC<HelpChatWidgetProps> = ({
  isOpen,
  onClose,
  authToken,
  apiBaseUrl,
  userId,
  siteId,
  containerClassName = '',
  theme = 'light'
}) => {
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);

  const apiService = useRef(new HelpChatApiService(apiBaseUrl, authToken));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Load conversation from session storage on mount
  useEffect(() => {
    if (isOpen && conversationId === null) {
      const savedConversationId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedConversationId) {
        loadConversationHistory(parseInt(savedConversationId));
      } else {
        // Show welcome message for new conversation
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = modalBodyRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Load conversation history from backend
   */
  const loadConversationHistory = async (convId: number) => {
    try {
      setIsLoading(true);
      const response = await apiService.current.getConversationHistory(convId, userId);

      if (response.success && response.messages.length > 0) {
        // Convert API messages to UI messages
        const loadedMessages: HelpMessage[] = response.messages.map((msg, index) => ({
          id: `${msg.message_id || index}`,
          message_id: msg.message_id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          timestamp: new Date(msg.created_at),
          sources: msg.sources,
          token_count: msg.token_count
        }));

        setMessages(loadedMessages);
        setConversationId(convId);
      } else {
        // If conversation not found or empty, start fresh
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send message to help chat
   */
  const handleSendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || isLoading) return;

    // Add user message to UI
    const userMessage: HelpMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Add loading indicator
    const loadingMessage: HelpMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Send to API
      const response = await apiService.current.sendMessage(
        messageText,
        userId,
        siteId,
        conversationId || undefined
      );

      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));

      if (response.success && response.message) {
        // Store conversation ID
        if (response.conversation_id && !conversationId) {
          setConversationId(response.conversation_id);
          sessionStorage.setItem(SESSION_STORAGE_KEY, response.conversation_id.toString());
        }

        // Add assistant response
        const assistantMessage: HelpMessage = {
          id: `assistant-${Date.now()}`,
          message_id: response.message.message_id,
          role: 'assistant',
          content: response.message.content,
          timestamp: new Date(),
          sources: response.message.sources,
          token_count: response.message.token_count,
          response_time_ms: response.message.response_time_ms
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'Failed to get response from server');
        setMessages(prev => prev.filter(msg => !msg.isLoading));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An unexpected error occurred. Please try again.');
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle key press (Enter to send)
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Clear conversation
   */
  const handleClearConversation = async () => {
    if (!conversationId) {
      // Just reset UI
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date()
      }]);
      return;
    }

    try {
      await apiService.current.clearConversation(conversationId, userId);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setConversationId(null);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Error clearing conversation:', err);
      setError('Failed to clear conversation');
    }
  };

  /**
   * Handle successful escalation
   */
  const handleEscalationSuccess = () => {
    setIsEscalationModalOpen(false);
    // Show success message
    const successMessage: HelpMessage = {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: '✅ Your request has been sent to our support team. You will receive a response via email shortly.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, successMessage]);
  };

  // Check for valid auth
  if (!authToken || authToken.trim() === '') {
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
            <CBadge color="info" className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', fontSize: '16px' }}>
              <CIcon icon={cilLifeRing} />
            </CBadge>
            <div className="fw-semibold">ProtocolSync Help Assistant</div>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center p-5">
            <div className="mb-3" style={{ fontSize: '48px' }}>🔒</div>
            <h4>Access Denied</h4>
            <p className="text-medium-emphasis">
              Please log into the ProtocolSync Portal to access the help assistant.
            </p>
          </div>
        </CModalBody>
      </CModal>
    );
  }

  return (
    <>
      <CModal
        size="xl"
        visible={isOpen}
        onClose={onClose}
        backdrop="static"
        alignment="center"
        className={`help-chat-modal ${theme} ${containerClassName}`.trim()}
      >
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2 justify-content-between w-100">
            <div className="d-flex align-items-center gap-2">
              <CBadge color="info" className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', fontSize: '16px' }}>
                <CIcon icon={cilLifeRing} />
              </CBadge>
              <div>
                <div className="fw-semibold">ProtocolSync Help Assistant</div>
                <small className="text-medium-emphasis">AI-powered help & documentation</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <CButton
                color="light"
                size="sm"
                onClick={handleClearConversation}
                disabled={messages.length <= 1}
              >
                Clear Chat
              </CButton>
              <CButton
                color="warning"
                size="sm"
                onClick={() => setIsEscalationModalOpen(true)}
                disabled={!conversationId}
              >
                Contact Support
              </CButton>
            </div>
          </CModalTitle>
        </CModalHeader>

        <CModalBody className="p-0" style={{ height: '600px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
          <div ref={modalBodyRef} className="help-chat-body" style={{ flex: 1, overflowY: 'auto' }}>
            <HelpMessageList messages={messages} />
            {error && (
              <div className="alert alert-danger m-3" role="alert">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="help-chat-footer">
            <div className="w-100 d-flex gap-2">
              <textarea
                className="form-control"
                placeholder="Ask a question about ProtocolSync..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                rows={2}
                style={{ resize: 'none' }}
              />
              <CButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="d-flex align-items-center gap-1"
              >
                <CIcon icon={cilPaperPlane} />
                {isLoading ? 'Sending...' : 'Send'}
              </CButton>
            </div>
          </div>
        </CModalBody>
      </CModal>

      {/* Escalation Modal */}
      {conversationId && (
        <HelpEscalationModal
          isOpen={isEscalationModalOpen}
          onClose={() => setIsEscalationModalOpen(false)}
          onSuccess={handleEscalationSuccess}
          conversationId={conversationId}
          userId={userId}
          apiService={apiService.current}
        />
      )}
    </>
  );
};

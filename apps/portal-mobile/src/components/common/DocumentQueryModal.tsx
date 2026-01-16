import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Avatar, IconButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { documentQueryService } from '../../services/apiClient';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface QueryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    document?: string;
    page?: number;
    section?: string | null;
    chunk_id?: number;
    similarity?: number;
  }>;
  isLoading?: boolean;
}

interface DocumentQueryModalProps {
  visible: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  documentVersion?: string;
}

export const DocumentQueryModal = ({
  visible,
  onClose,
  documentId,
  documentName,
  documentVersion,
}: DocumentQueryModalProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const welcomeMessage = `Hi! I'm here to help you understand the ${documentName}${
    documentVersion ? ` (${documentVersion})` : ''
  } protocol. What would you like to know?`;

  // Initialize with welcome message
  useEffect(() => {
    if (visible && messages.length === 0) {
      showWelcomeMessage();
    }
  }, [visible]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const showWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (!messageText || loading || !user?.id) return;

    const userId = user.user_id ? String(user.user_id) : user.id;

    // Add user message to UI
    const userMessage: QueryMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setError(null);

    // Add loading indicator
    const loadingMessage: QueryMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await documentQueryService.sendQuery({
        query: messageText,
        userId,
        documentId,
        documentName,
      });

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      if (response.success && response.data?.answer) {
        const assistantMessage: QueryMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
          sources: response.data.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'Failed to get response');
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      }
    } catch (err) {
      console.error('Error sending query:', err);
      setError('An unexpected error occurred. Please try again.');
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setError(null);
    showWelcomeMessage();
  };

  const renderMessage = (message: QueryMessage) => {
    const isUser = message.role === 'user';

    if (message.isLoading) {
      return (
        <View key={message.id} style={styles.loadingContainer}>
          <Avatar.Icon
            size={32}
            icon="robot"
            style={styles.assistantAvatar}
            color="#FFFFFF"
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={designTokens.color.accent.green500} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <Avatar.Icon
            size={32}
            icon="robot"
            style={styles.assistantAvatar}
            color="#FFFFFF"
            labelStyle={styles.avatarLabel}
          />
        )}
        <View style={styles.messageBubble}>
          <View style={[isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {message.content}
            </Text>
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
              {message.timestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        {isUser && (
          <Avatar.Text
            size={32}
            label={user?.displayName?.charAt(0) || 'U'}
            style={styles.userAvatar}
            color="#FFFFFF"
            labelStyle={styles.avatarLabel}
          />
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <Avatar.Icon size={40} icon="file-document" style={styles.headerIcon} color="#FFFFFF" />
            <View>
              <Text style={styles.headerTitle}>Document Query Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {documentName} {documentVersion && `(${documentVersion})`}
              </Text>
            </View>
          </View>
          <IconButton icon="close" size={24} onPress={onClose} />
        </View>

        {/* Messages */}
        <View style={styles.content}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map(renderMessage)}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask a question about this protocol..."
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSendMessage}
                disabled={loading || !inputText.trim()}
              />
            }
            onSubmitEditing={handleSendMessage}
          />
        </View>

        {/* Footer Buttons */}
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearConversation}>
            <Text style={styles.clearButtonText}>Clear Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: designTokens.spacing.m,
    paddingVertical: designTokens.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.s,
  },
  headerIcon: {
    backgroundColor: '#3B82F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  headerSubtitle: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.color.text.subtle,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: designTokens.spacing.m,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: designTokens.spacing.m,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: designTokens.color.accent.green600,
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.m,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.m,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: designTokens.typography.fontSize.m,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: designTokens.color.text.body,
  },
  timestamp: {
    fontSize: designTokens.typography.fontSize.xs,
    marginTop: designTokens.spacing.xs,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: designTokens.color.text.subtle,
  },
  userAvatar: {
    backgroundColor: designTokens.color.accent.green600,
    marginLeft: designTokens.spacing.s,
  },
  assistantAvatar: {
    backgroundColor: '#3B82F6',
    marginRight: designTokens.spacing.s,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourcesContainer: {
    marginTop: designTokens.spacing.m,
    paddingTop: designTokens.spacing.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  sourcesTitle: {
    fontSize: designTokens.typography.fontSize.s,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
  },
  sourceItem: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: designTokens.spacing.m,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.m,
    borderBottomLeftRadius: 4,
    gap: designTokens.spacing.s,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.s,
    marginVertical: designTokens.spacing.m,
  },
  errorText: {
    color: '#DC2626',
    fontSize: designTokens.typography.fontSize.s,
  },
  inputContainer: {
    padding: designTokens.spacing.m,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
  },
  input: {
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
  },
  footerButtons: {
    padding: designTokens.spacing.m,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  clearButton: {
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.body,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { TextInput, Button, Avatar, IconButton, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { helpChatService } from '../../services/apiClient';
import type { HelpMessage } from '../../services/apiClient';
import designTokens from '../../design-tokens.json';

const WELCOME_MESSAGE = `Hi! I'm your Protocol Sync Help Assistant. I can help you with:

• How to use Protocol Sync features
• Questions about protocol management
• Delegation and compliance workflows
• Site-specific protocol details

Ask me anything, or click "Contact Support" if you need to speak with a person.`;

const SESSION_STORAGE_KEY = 'protocolsync_help_conversation_id';

interface HelpChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpChatModal = ({ visible, onClose }: HelpChatModalProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load conversation from async storage on mount
  useEffect(() => {
    if (visible && conversationId === null) {
      loadConversation();
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

  const loadConversation = async () => {
    try {
      const savedConversationId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (savedConversationId && user?.user_id) {
        const response = await helpChatService.getConversationHistory(
          parseInt(savedConversationId),
          user.user_id
        );

        if (response.success && response.data?.messages && response.data.messages.length > 0) {
          const loadedMessages: HelpMessage[] = response.data.messages.map((msg, index) => ({
            id: `${msg.message_id || index}`,
            message_id: msg.message_id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
            timestamp: new Date(msg.created_at),
            sources: msg.sources,
            token_count: msg.token_count,
          }));

          setMessages(loadedMessages);
          setConversationId(parseInt(savedConversationId));
        } else {
          // If conversation not found or empty, start fresh
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          showWelcomeMessage();
        }
      } else {
        showWelcomeMessage();
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      showWelcomeMessage();
    }
  };

  const showWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (!messageText || loading || !user?.user_id) return;

    // Add user message to UI
    const userMessage: HelpMessage = {
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
    const loadingMessage: HelpMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await helpChatService.sendMessage({
        message: messageText,
        user_id: user.user_id,
        site_id: user.site?.id ? parseInt(user.site.id) : undefined,
        conversation_id: conversationId || undefined,
      });

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      if (response.success && response.data?.message) {
        // Store conversation ID
        if (response.data.conversation_id && !conversationId) {
          setConversationId(response.data.conversation_id);
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, response.data.conversation_id.toString());
        }

        // Add assistant response
        const assistantMessage: HelpMessage = {
          id: `assistant-${Date.now()}`,
          message_id: response.data.message.message_id,
          role: 'assistant',
          content: response.data.message.content,
          timestamp: new Date(),
          sources: response.data.message.sources,
          token_count: response.data.message.token_count,
          response_time_ms: response.data.message.response_time_ms,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'Failed to get response from server');
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An unexpected error occurred. Please try again.');
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = async () => {
    if (!conversationId) {
      showWelcomeMessage();
      return;
    }

    if (!user?.user_id) return;

    try {
      await helpChatService.clearConversation(conversationId, user.user_id);
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      setConversationId(null);
      showWelcomeMessage();
      setError(null);
    } catch (err) {
      console.error('Error clearing conversation:', err);
      setError('Failed to clear conversation');
    }
  };

  const handleQuickAction = (question: string) => {
    setInputText(question);
  };

  const renderMessage = (message: HelpMessage) => {
    const isUser = message.role === 'user';

    if (message.isLoading) {
      return (
        <View key={message.id} style={styles.loadingContainer}>
          <Avatar.Text
            size={32}
            label="PS"
            style={styles.assistantAvatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={designTokens.color.text.subtle} />
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
          <Avatar.Text
            size={32}
            label="PS"
            style={styles.assistantAvatar}
            labelStyle={styles.avatarLabel}
          />
        )}

        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>

          {message.sources && message.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesTitle}>Sources:</Text>
              {message.sources.map((source, index) => (
                <Text key={index} style={styles.sourceItem}>
                  • {source.document_name || 'Reference document'}
                  {source.page_number ? ` (Page ${source.page_number})` : ''}
                </Text>
              ))}
            </View>
          )}

          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isUser && (
          <Avatar.Text
            size={32}
            label={user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
            style={styles.userAvatar}
            labelStyle={styles.avatarLabel}
          />
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <Avatar.Icon
              size={40}
              icon="lifebuoy"
              style={styles.headerIcon}
            />
            <View>
              <Text style={styles.headerTitle}>ProtocolSync Help Assistant</Text>
              <Text style={styles.headerSubtitle}>AI-powered help & documentation</Text>
            </View>
          </View>
          <IconButton icon="close" size={24} onPress={onClose} />
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
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

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question about ProtocolSync..."
              mode="outlined"
              style={styles.input}
              multiline
              maxLength={500}
              disabled={loading}
              right={
                <TextInput.Icon
                  icon="send"
                  onPress={handleSendMessage}
                  disabled={loading || !inputText.trim()}
                  color={loading || !inputText.trim() ? designTokens.color.text.subtle : designTokens.color.accent.green600}
                />
              }
            />
          </View>

          {/* Footer Buttons */}
          <View style={styles.footerButtons}>
            <TouchableOpacity
              onPress={handleClearConversation}
              style={styles.clearButton}
              disabled={loading}
            >
              <Text style={styles.clearButtonText}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Contact Support',
                  'Would you like to email our support team?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Email Support',
                      onPress: () => {
                        Linking.openURL('mailto:support@protocolsync.org?subject=Protocol Sync Support Request');
                      },
                    },
                  ]
                );
              }}
              style={styles.contactButton}
              disabled={loading}
            >
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.m,
  },
  userBubble: {
    backgroundColor: designTokens.color.accent.green600,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
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
    flexDirection: 'row',
    gap: designTokens.spacing.m,
    padding: designTokens.spacing.m,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  clearButton: {
    flex: 1,
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
  contactButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: designTokens.color.accent.green500,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

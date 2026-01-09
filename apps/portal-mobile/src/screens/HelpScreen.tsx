import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Avatar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '../design-tokens.json';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    url: string;
    page?: number;
  }>;
}

export const HelpScreen = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your Protocol Sync assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post<{ message: string; sources?: any[] }>('/help/chat', {
        message: inputText,
        conversationId: null,
      });

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
          sources: response.data.sources,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again or contact support@protocolsync.org',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.assistantMessageContainer]}
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
                  • {source.title}
                </Text>
              ))}
            </View>
          )}

          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    <View style={styles.wrapper}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
        {messages.map(renderMessage)}

        {loading && (
          <View style={styles.loadingContainer}>
            <Avatar.Text
              size={32}
              label="PS"
              style={styles.assistantAvatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.loadingBubble}>
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text style={styles.quickActionsTitle}>Quick Help</Text>
            <Button
              mode="outlined"
              onPress={() => setInputText('How do I add a new site?')}
              style={styles.quickButton}
            >
              How do I add a new site?
            </Button>
            <Button
              mode="outlined"
              onPress={() => setInputText('How do I generate a report?')}
              style={styles.quickButton}
            >
              How do I generate a report?
            </Button>
            <Button
              mode="outlined"
              onPress={() => setInputText('How do I manage users?')}
              style={styles.quickButton}
            >
              How do I manage users?
            </Button>
          </Card.Content>
        </Card>

        </ScrollView>

        <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question..."
          mode="outlined"
          style={styles.input}
          multiline
          maxLength={500}
          disabled={loading}
        />
        <Button
          mode="contained"
          onPress={handleSendMessage}
          style={styles.sendButton}
          buttonColor={designTokens.color.accent.green600}
          disabled={loading || !inputText.trim()}
        >
          Send
        </Button>
        </View>
      </KeyboardAvoidingView>
      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  container: {
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
    backgroundColor: '#F3F4F6',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.m,
    borderBottomLeftRadius: 4,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
    fontStyle: 'italic',
  },
  quickActionsCard: {
    marginTop: designTokens.spacing.l,
    backgroundColor: '#FFFFFF',
  },
  quickActionsTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.m,
  },
  quickButton: {
    marginBottom: designTokens.spacing.s,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: designTokens.spacing.m,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    gap: designTokens.spacing.s,
  },
  input: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});

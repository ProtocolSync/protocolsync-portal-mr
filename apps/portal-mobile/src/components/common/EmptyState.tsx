import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.button}
          buttonColor={designTokens.color.accent.green600}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
    backgroundColor: designTokens.color.background.page,
  },
  icon: {
    fontSize: 64,
    marginBottom: designTokens.spacing.m,
  },
  title: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.s,
    textAlign: 'center',
  },
  message: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    textAlign: 'center',
    marginBottom: designTokens.spacing.l,
    lineHeight: 24,
  },
  button: {
    marginTop: designTokens.spacing.m,
  },
});

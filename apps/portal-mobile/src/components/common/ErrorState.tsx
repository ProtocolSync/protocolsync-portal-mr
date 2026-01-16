import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.button}
          buttonColor={designTokens.color.accent.green600}
        >
          Try Again
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
    backgroundColor: designTokens.color.background.page,
    padding: designTokens.spacing.xl,
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
  },
  message: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    textAlign: 'center',
    marginBottom: designTokens.spacing.l,
  },
  button: {
    marginTop: designTokens.spacing.m,
  },
});

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import designTokens from '../../design-tokens.json';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={designTokens.color.accent.green600} />
      <Text style={styles.text}>{message}</Text>
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
  text: {
    marginTop: designTokens.spacing.m,
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
});

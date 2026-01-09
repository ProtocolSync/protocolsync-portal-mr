import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { ENV } from '../../config/env';
import designTokens from '../../design-tokens.json';

export const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  const websiteUrl = ENV.WEBSITE_URL || 'https://protocolsync.com';

  const handleLinkPress = (path: string) => {
    Linking.openURL(`${websiteUrl}${path}`);
  };

  return (
    <View style={styles.footer}>
      <View style={styles.content}>
        <Text style={styles.text}>© {currentYear} Protocol Sync LLC.</Text>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => handleLinkPress('/terms')}>
          <Text style={styles.link}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => handleLinkPress('/privacy')}>
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: designTokens.color.background.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  text: {
    fontSize: 12,
    color: designTokens.color.text.default,
  },
  separator: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
  },
  link: {
    fontSize: 12,
    color: designTokens.color.accent.blue500,
    textDecorationLine: 'underline',
  },
});

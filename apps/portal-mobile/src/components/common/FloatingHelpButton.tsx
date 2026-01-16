import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { HelpChatModal } from './HelpChatModal';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

export const FloatingHelpButton = () => {
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <>
      <FAB
        icon="lifebuoy"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => setHelpModalVisible(true)}
        label="Help"
      />
      <HelpChatModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
  },
});

import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface User {
  user_id: number;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
}

interface ToggleUserStatusModalProps {
  visible: boolean;
  user: User | null;
  onDismiss: () => void;
  onConfirm: (user: User) => Promise<void>;
}

export const ToggleUserStatusModal: React.FC<ToggleUserStatusModalProps> = ({
  visible,
  user,
  onDismiss,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      setError(null);
    }
  }, [visible]);

  if (!user) return null;

  const isActive = user.status === 'active' || user.status === 'pending';
  const newStatus = isActive ? 'inactive' : 'active';

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm(user);
      // Parent will close modal on success
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isActive ? 'Deactivate' : 'Activate'} User
          </Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>

          <Text style={styles.text}>
            Are you sure you want to {isActive ? 'deactivate' : 'activate'}{' '}
            <Text style={styles.bold}>{user.name}</Text>?
          </Text>

          <Text style={styles.description}>
            {isActive
              ? 'The user will no longer be able to access the system until reactivated.'
              : 'The user will be able to access the system again.'}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              { backgroundColor: isActive ? '#F59E0B' : '#10B981' },
              loading && styles.confirmButtonDisabled
            ]}
            disabled={loading}
          >
            <Text style={styles.confirmButtonText}>
              {isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  closeButton: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
    justifyContent: 'center',
  },
  text: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    textAlign: 'center',
    marginBottom: designTokens.spacing.s,
  },
  bold: {
    fontWeight: '600',
  },
  description: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    textAlign: 'center',
    marginBottom: designTokens.spacing.l,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.m,
  },
  errorText: {
    color: '#DC2626',
    fontSize: designTokens.typography.fontSize.m,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: designTokens.spacing.l,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    gap: designTokens.spacing.m,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  cancelButtonText: {
    color: designTokens.color.text.body,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import designTokens from '../../design-tokens.json';

interface Delegation {
  id: string;
  userName: string;
  jobTitle: string;
  protocolName: string;
  protocolVersion?: string;
}

interface RevokeDelegationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  delegation: Delegation | null;
}

export const RevokeDelegationModal: React.FC<RevokeDelegationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  delegation,
}) => {
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    try {
      setRevoking(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setRevoking(false);
    }
  };

  if (!delegation) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.title}>Revoke Delegation</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Warning: This action cannot be undone</Text>
            <Text style={styles.warningText}>
              Revoking this delegation will immediately terminate the staff member's assigned
              responsibilities.
            </Text>
          </View>

          {/* Delegation Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Staff Member</Text>
              <Text style={styles.detailValue}>{delegation.userName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Job Title</Text>
              <Text style={styles.detailValue}>{delegation.jobTitle}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Protocol</Text>
              <View style={styles.protocolContainer}>
                <Text style={styles.detailValue}>{delegation.protocolName}</Text>
                {delegation.protocolVersion && (
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionBadgeText}>{delegation.protocolVersion}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={revoking}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.revokeButton, revoking && styles.buttonDisabled]}
            onPress={handleRevoke}
            disabled={revoking}
          >
            {revoking ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.revokeButtonText}> Revoking...</Text>
              </>
            ) : (
              <>
                <Text style={styles.revokeButtonIcon}>⊗</Text>
                <Text style={styles.revokeButtonText}> Revoke Delegation</Text>
              </>
            )}
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
  },
  warningBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F1D1D',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    textTransform: 'uppercase',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: designTokens.color.text.heading,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  protocolContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  versionBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.color.border.subtle,
  },
  footer: {
    flexDirection: 'row',
    padding: designTokens.spacing.l,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  cancelButtonText: {
    color: designTokens.color.text.body,
    fontSize: 16,
    fontWeight: '600',
  },
  revokeButton: {
    backgroundColor: '#DC2626',
  },
  revokeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  revokeButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

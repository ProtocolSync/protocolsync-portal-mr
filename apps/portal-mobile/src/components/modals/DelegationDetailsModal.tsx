import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import designTokens from '../../design-tokens.json';

interface Delegation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  protocolVersionId: string;
  protocolName: string;
  protocolVersion?: string;
  jobTitle: string;
  delegationDate: string;
  delegatedBy: string;
  delegatedByName: string;
  signatureDate?: string;
  signatureIp?: string;
  status: 'pending' | 'signed' | 'revoked';
  createdAt: string;
  recordHash?: string;
}

interface DelegationDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  delegation: Delegation | null;
}

export const DelegationDetailsModal: React.FC<DelegationDetailsModalProps> = ({
  visible,
  onClose,
  delegation,
}) => {
  if (!delegation) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = () => {
    switch (delegation.status) {
      case 'signed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'revoked':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Delegation Record Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {/* Delegation ID */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Delegation ID</Text>
            <Text style={styles.infoValue}>{delegation.id}</Text>
          </View>

          <View style={styles.divider} />

          {/* Staff Member */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Staff Member</Text>
            <Text style={styles.infoValueLarge}>{delegation.userName}</Text>
            <Text style={styles.infoValueEmail}>{delegation.userEmail}</Text>
          </View>

          <View style={styles.divider} />

          {/* Job Title and Protocol */}
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Job Title</Text>
              <Text style={styles.infoValue}>{delegation.jobTitle}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Protocol</Text>
              <Text style={styles.infoValue}>{delegation.protocolName}</Text>
              {delegation.protocolVersion && (
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>{delegation.protocolVersion}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delegated By */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Delegated By</Text>
            <Text style={styles.infoValueLarge}>{delegation.delegatedByName}</Text>
            <Text style={styles.infoValueSubtle}>{formatDate(delegation.delegationDate)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusBadgeText}>
                  {delegation.status === 'signed' && '✓ '}
                  {delegation.status.charAt(0).toUpperCase() + delegation.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.infoColumn} />
          </View>

          {/* Record Hash */}
          {delegation.recordHash && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Record Hash (21 CFR Part 11 Compliance)</Text>
                <Text style={styles.hashText}>{delegation.recordHash}</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
            <Text style={styles.closeFooterButtonText}>CLOSE</Text>
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
  infoSection: {
    marginBottom: designTokens.spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: designTokens.spacing.m,
    gap: designTokens.spacing.m,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: designTokens.color.text.body,
  },
  infoValueLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  infoValueEmail: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
  },
  infoValueSubtle: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
    marginTop: 4,
  },
  versionBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.color.border.subtle,
    marginVertical: designTokens.spacing.l,
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: designTokens.color.text.subtle,
    marginTop: 4,
  },
  footer: {
    padding: designTokens.spacing.l,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
  },
  closeFooterButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

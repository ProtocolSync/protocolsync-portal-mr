import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { Site } from '@protocolsync/shared-services';
import designTokens from '../../design-tokens.json';

interface DisableSiteModalProps {
  visible: boolean;
  site: Site | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export const DisableSiteModal = ({ visible, site, onClose, onSubmit }: DisableSiteModalProps) => {
  const [disableReason, setDisableReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!site) return null;

  const isActivating = site.status !== 'active';
  const action = isActivating ? 'Enable' : 'Disable';
  const newStatus = isActivating ? 'active' : 'inactive';

  const handleSubmit = async () => {
    if (!disableReason.trim()) {
      Alert.alert('Error', 'Reason is required for 21 CFR Part 11 compliance');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(disableReason);
      setDisableReason('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update site status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDisableReason('');
    onClose();
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#10B981' : '#6B7280';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {action} Site: {site.site_number}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Site Name */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Site Name:</Text>
            <Text style={styles.detailValue}>{site.site_name}</Text>
          </View>

          {/* Current Status */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Current Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(site.status) }]}>
              <Text style={styles.statusBadgeText}>{site.status === 'active' ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>

          {/* New Status */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>New Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(newStatus) }]}>
              <Text style={styles.statusBadgeText}>{isActivating ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Important:</Text>
            {!isActivating ? (
              <>
                <Text style={styles.warningText}>• Users will not be able to upload new documents to this site</Text>
                <Text style={styles.warningText}>• The site will not count against your subscription limits</Text>
                <Text style={styles.warningText}>• All existing data remains accessible for viewing</Text>
                <Text style={styles.warningText}>• This action is fully auditable per 21 CFR Part 11</Text>
              </>
            ) : (
              <>
                <Text style={styles.warningText}>• Users will be able to upload documents to this site</Text>
                <Text style={styles.warningText}>• The site will count against your subscription limits</Text>
                <Text style={styles.warningText}>• This action is fully auditable per 21 CFR Part 11</Text>
              </>
            )}
          </View>

          {/* Reason Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reason for Status Change *</Text>
            <Text style={styles.helperText}>Required for 21 CFR Part 11 compliance and audit trail</Text>
            <TextInput
              style={styles.textArea}
              value={disableReason}
              onChangeText={setDisableReason}
              placeholder={isActivating 
                ? 'e.g., "Site reopening after equipment upgrade"' 
                : 'e.g., "Site temporarily closed for facility maintenance"'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isSubmitting}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{action} Site</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
  },
  detailSection: {
    marginBottom: designTokens.spacing.l,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: designTokens.color.text.body,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: designTokens.spacing.m,
    borderRadius: 6,
    marginBottom: designTokens.spacing.l,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
  },
  formGroup: {
    marginBottom: designTokens.spacing.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.body,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
    fontStyle: 'italic',
  },
  textArea: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: designTokens.color.text.body,
    minHeight: 100,
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
  submitButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 140,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

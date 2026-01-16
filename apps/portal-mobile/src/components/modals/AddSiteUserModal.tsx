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
import { useAuth } from '../../contexts/AuthContext';
import { sitesService } from '../../services/apiClient';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface AddSiteUserModalProps {
  visible: boolean;
  siteId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddSiteUserModal = ({ visible, siteId, onClose, onSuccess }: AddSiteUserModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    job_title: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.name) {
      Alert.alert('Error', 'Email and Full Name are required');
      return;
    }

    if (!user?.user_id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        email: formData.email,
        name: formData.name,
        job_title: formData.job_title,
        provisioned_by_user_id: user.user_id,
      };

      console.log('[AddSiteUserModal] Provisioning site user for site:', siteId);
      console.log('[AddSiteUserModal] Request body:', requestBody);

      const response = await sitesService.provisionSiteUser(siteId, requestBody);

      if (!response.success) {
        throw new Error(response.error || 'Failed to add site user');
      }

      console.log('[AddSiteUserModal] Site user provisioned:', response.data);

      Alert.alert('Success', `${formData.email} has been provisioned successfully. They will receive an invitation email.`);

      // Reset form
      setFormData({
        email: '',
        name: '',
        job_title: '',
      });

      onSuccess();
    } catch (error: any) {
      console.error('[AddSiteUserModal] Error:', error);
      Alert.alert('Error', error.message || 'Failed to add site user');
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.title}>Add Site User</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => setFormData({ ...formData, email: value })}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => setFormData({ ...formData, name: value })}
              placeholder="Jane Smith"
            />
          </View>

          {/* Job Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              value={formData.job_title}
              onChangeText={(value) => setFormData({ ...formData, job_title: value })}
              placeholder="Clinical Research Coordinator"
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              User will be added to this site and receive an Entra ID invitation email. They must complete registration before they can log in.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
              <Text style={styles.submitButtonText}>Add Site User</Text>
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
  formGroup: {
    marginBottom: designTokens.spacing.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.body,
    marginBottom: designTokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: designTokens.color.text.body,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    padding: designTokens.spacing.m,
    marginTop: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: designTokens.spacing.s,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#075985',
    lineHeight: 18,
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

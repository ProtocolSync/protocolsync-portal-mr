import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import designTokens from '../../design-tokens.json';
import type { CreateDelegationData } from '@protocolsync/shared-services';

interface AssignDelegationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDelegationData) => Promise<void>;
  protocolVersions: any[];
  siteUsers: any[];
}

export const AssignDelegationModal: React.FC<AssignDelegationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  protocolVersions,
  siteUsers,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    protocolVersionId: '',
    jobTitle: '',
  });

  const handleSubmit = async () => {
    if (!formData.userId || !formData.protocolVersionId || !formData.jobTitle.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Find the user to get their user_id
      const selectedUser = siteUsers.find(
        (u) => u.email === formData.userId || String(u.user_id || u.id) === formData.userId
      );

      if (!selectedUser) {
        throw new Error('User not found');
      }

      const delegatedUserId = selectedUser.user_id || selectedUser.id;

      const data: CreateDelegationData = {
        delegated_by_user_id: '', // Will be set by the parent component
        delegated_user_id: String(delegatedUserId),
        protocol_version_id: parseInt(formData.protocolVersionId),
        delegated_job_title: formData.jobTitle,
        task_description: `Delegated as ${formData.jobTitle}`,
        effective_start_date: new Date().toISOString().split('T')[0],
        effective_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        training_required: false,
      };

      await onSubmit(data);

      // Reset form
      setFormData({ userId: '', protocolVersionId: '', jobTitle: '' });
      onClose();
    } catch (error) {
      console.error('[AssignDelegationModal] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create delegation');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.title}>Create New Delegation</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {/* Staff Member */}
          <View style={styles.field}>
            <Text style={styles.label}>Staff Member *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.userId}
                onValueChange={(value) => setFormData({ ...formData, userId: value })}
                style={styles.picker}
                enabled={!submitting}
              >
                <Picker.Item label="Select staff member..." value="" />
                {siteUsers.map((u) => (
                  <Picker.Item
                    key={u.user_id || u.id}
                    label={`${u.full_name || u.name}${u.job_title ? ` - ${u.job_title}` : ''} (${u.email})`}
                    value={u.email}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Protocol Version */}
          <View style={styles.field}>
            <Text style={styles.label}>Protocol Version *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.protocolVersionId}
                onValueChange={(value) =>
                  setFormData({ ...formData, protocolVersionId: value })
                }
                style={styles.picker}
                enabled={!submitting}
              >
                <Picker.Item label="Select protocol version..." value="" />
                {protocolVersions.map((p) => (
                  <Picker.Item
                    key={p.version_id || p.id}
                    label={`${p.display_name || p.protocol_name} - ${p.current_status || p.version_number}`}
                    value={String(p.version_id || p.id)}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Job Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.jobTitle}
              onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
              placeholder="e.g., Principal Investigator, Study Coordinator, etc."
              placeholderTextColor={designTokens.color.text.subtle}
              editable={!submitting}
            />
            <Text style={styles.helpText}>
              Enter the staff member's job title for this delegation
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.createButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.createButtonText}> Creating...</Text>
              </>
            ) : (
              <Text style={styles.createButtonText}>Create Delegation</Text>
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
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: designTokens.color.text.body,
  },
  helpText: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    marginTop: 4,
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
  createButton: {
    backgroundColor: designTokens.color.accent.green500,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

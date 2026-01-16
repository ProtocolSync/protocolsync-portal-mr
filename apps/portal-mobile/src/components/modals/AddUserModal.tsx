import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, View, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

export interface AddUserFormData {
  role: string;
  email: string;
  name: string;
  job_title: string;
  site_id: string;
}

interface Site {
  site_id: number;
  site_name: string;
  site_number: string;
  institution_name: string;
}

interface AddUserModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (formData: AddUserFormData) => Promise<void>;
  sites: Site[];
  loadingSites: boolean;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  sites,
  loadingSites,
}) => {
  const [formData, setFormData] = useState<AddUserFormData>({
    role: 'site_user',
    email: '',
    name: '',
    job_title: '',
    site_id: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setFormData({
        role: 'site_user',
        email: '',
        name: '',
        job_title: '',
        site_id: '',
      });
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.email || !formData.name || !formData.role) {
      setError('Email, Full Name, and Organization Role are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Parent will close modal on success
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
      setSubmitting(false);
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
          <Text style={styles.title}>Add New User</Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Organization Role *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                style={styles.picker}
              >
                <Picker.Item label="Site User" value="site_user" />
                <Picker.Item label="Trial Lead" value="trial_lead" />
                <Picker.Item label="Site Administrator" value="site_admin" />
              </Picker>
            </View>
            <Text style={styles.helperText}>
              Site Users participate in trials. Trial Leads manage protocol versions and delegations for
              their trials. Site Administrators manage trials and site users.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Smith"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Clinical Research Coordinator"
              value={formData.job_title}
              onChangeText={(text) => setFormData({ ...formData, job_title: text })}
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Assign to Site (Optional)</Text>
            {loadingSites ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={designTokens.color.accent.green500} />
                <Text style={styles.loadingText}>Loading sites...</Text>
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.site_id}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                  style={styles.picker}
                  enabled={!submitting}
                >
                  <Picker.Item label="-- No site assignment --" value="" />
                  {sites.map((site) => (
                    <Picker.Item
                      key={site.site_id}
                      label={`${site.site_number} - ${site.site_name}`}
                      value={site.site_id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              An invitation email will be sent to the user with instructions to set up their account.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Adding User...' : 'Add User'}
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
  },
  formGroup: {
    marginBottom: designTokens.spacing.l,
  },
  label: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
  },
  helperText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginTop: designTokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: designTokens.color.border.light,
    borderRadius: designTokens.spacing.xs,
    padding: designTokens.spacing.m,
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.light,
    borderRadius: designTokens.spacing.xs,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.m,
    backgroundColor: '#F3F4F6',
    borderRadius: designTokens.spacing.xs,
  },
  loadingText: {
    marginLeft: designTokens.spacing.m,
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  infoContainer: {
    backgroundColor: '#DBEAFE',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.xs,
    marginTop: designTokens.spacing.l,
  },
  infoText: {
    fontSize: designTokens.typography.fontSize.s,
    color: '#1E40AF',
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
    minWidth: 120,
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

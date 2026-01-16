import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
}

export interface AddAdminFormData {
  email: string;
  full_name: string;
  job_title: string;
  site_id: number | null;
}

interface AddAdminModalProps {
  visible: boolean;
  sites: Site[];
  loadingSites: boolean;
  onClose: () => void;
  onSubmit: (data: AddAdminFormData) => Promise<void>;
}

export const AddAdminModal = ({ visible, sites, loadingSites, onClose, onSubmit }: AddAdminModalProps) => {
  const [formData, setFormData] = useState<AddAdminFormData>({
    email: '',
    full_name: '',
    job_title: '',
    site_id: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.full_name || !formData.job_title || !formData.site_id) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Reset form on success
      setFormData({
        email: '',
        full_name: '',
        job_title: '',
        site_id: null,
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add administrator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      full_name: '',
      job_title: '',
      site_id: null,
    });
    onClose();
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
          <Text style={styles.title}>Add Site Administrator</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => setFormData({ ...formData, email: value })}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(value) => setFormData({ ...formData, full_name: value })}
              placeholder="Jane Smith"
              editable={!isSubmitting}
            />
          </View>

          {/* Job Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.job_title}
              onChangeText={(value) => setFormData({ ...formData, job_title: value })}
              placeholder="Site Administrator"
              editable={!isSubmitting}
            />
          </View>

          {/* Site Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Site *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value as number })}
                enabled={!isSubmitting && !loadingSites}
                style={styles.picker}
              >
                <Picker.Item label="Select a site..." value={null} />
                {sites.map(site => (
                  <Picker.Item
                    key={site.site_id}
                    label={`${site.site_number} - ${site.site_name}`}
                    value={site.site_id}
                  />
                ))}
              </Picker>
            </View>
            {loadingSites && (
              <Text style={styles.loadingText}>Loading sites...</Text>
            )}
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
              <Text style={styles.submitButtonText}>Add Administrator</Text>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingText: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    marginTop: 4,
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
    flex: 1,
    alignItems: 'center',
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
    flex: 1,
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

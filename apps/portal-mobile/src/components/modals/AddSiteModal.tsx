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
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

export interface SiteFormData {
  site_number: string;
  site_name: string;
  institution_name: string;
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

interface AddSiteModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => Promise<void>;
}

export const AddSiteModal = ({ visible, onClose, onSubmit }: AddSiteModalProps) => {
  const [formData, setFormData] = useState<SiteFormData>({
    site_number: '',
    site_name: '',
    institution_name: '',
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof SiteFormData, string>> = {};

    if (!formData.site_number.trim()) errors.site_number = 'Site Number is required';
    if (!formData.site_name.trim()) errors.site_name = 'Site Name is required';
    if (!formData.institution_name.trim()) errors.institution_name = 'Institution Name is required';
    if (!formData.address_line1.trim()) errors.address_line1 = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state_province.trim()) errors.state_province = 'State/Province is required';
    if (!formData.postal_code.trim()) errors.postal_code = 'Postal Code is required';
    if (!formData.country.trim()) errors.country = 'Country is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Reset form on success
      setFormData({
        site_number: '',
        site_name: '',
        institution_name: '',
        address_line1: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'United States',
      });
      setFormErrors({});
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      site_number: '',
      site_name: '',
      institution_name: '',
      address_line1: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: 'United States',
    });
    setFormErrors({});
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
          <Text style={styles.title}>Add New Site</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Site Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Site Number *</Text>
            <TextInput
              style={[styles.input, formErrors.site_number && styles.inputError]}
              value={formData.site_number}
              onChangeText={(value) => setFormData({ ...formData, site_number: value })}
              placeholder="e.g., SITE-004"
            />
            {formErrors.site_number && (
              <Text style={styles.errorText}>{formErrors.site_number}</Text>
            )}
          </View>

          {/* Site Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Site Name *</Text>
            <TextInput
              style={[styles.input, formErrors.site_name && styles.inputError]}
              value={formData.site_name}
              onChangeText={(value) => setFormData({ ...formData, site_name: value })}
              placeholder="e.g., Boston Medical Center - Oncology"
            />
            {formErrors.site_name && (
              <Text style={styles.errorText}>{formErrors.site_name}</Text>
            )}
          </View>

          {/* Institution Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Institution Name *</Text>
            <TextInput
              style={[styles.input, formErrors.institution_name && styles.inputError]}
              value={formData.institution_name}
              onChangeText={(value) => setFormData({ ...formData, institution_name: value })}
              placeholder="e.g., Boston Medical Center"
            />
            {formErrors.institution_name && (
              <Text style={styles.errorText}>{formErrors.institution_name}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, formErrors.address_line1 && styles.inputError]}
              value={formData.address_line1}
              onChangeText={(value) => setFormData({ ...formData, address_line1: value })}
              placeholder="e.g., 123 Medical Plaza"
            />
            {formErrors.address_line1 && (
              <Text style={styles.errorText}>{formErrors.address_line1}</Text>
            )}
          </View>

          {/* City */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, formErrors.city && styles.inputError]}
              value={formData.city}
              onChangeText={(value) => setFormData({ ...formData, city: value })}
              placeholder="e.g., Boston"
            />
            {formErrors.city && (
              <Text style={styles.errorText}>{formErrors.city}</Text>
            )}
          </View>

          {/* State/Province */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>State/Province *</Text>
            <TextInput
              style={[styles.input, formErrors.state_province && styles.inputError]}
              value={formData.state_province}
              onChangeText={(value) => setFormData({ ...formData, state_province: value })}
              placeholder="e.g., MA"
            />
            {formErrors.state_province && (
              <Text style={styles.errorText}>{formErrors.state_province}</Text>
            )}
          </View>

          {/* Postal Code */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={[styles.input, formErrors.postal_code && styles.inputError]}
              value={formData.postal_code}
              onChangeText={(value) => setFormData({ ...formData, postal_code: value })}
              placeholder="e.g., 02101"
            />
            {formErrors.postal_code && (
              <Text style={styles.errorText}>{formErrors.postal_code}</Text>
            )}
          </View>

          {/* Country */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={[styles.input, formErrors.country && styles.inputError]}
              value={formData.country}
              onChangeText={(value) => setFormData({ ...formData, country: value })}
              placeholder="United States"
            />
            {formErrors.country && (
              <Text style={styles.errorText}>{formErrors.country}</Text>
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
              <Text style={styles.submitButtonText}>Add Site</Text>
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
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
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

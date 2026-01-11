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
import { useAuth } from '../../contexts/AuthContext';
import { ENV } from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import designTokens from '../../design-tokens.json';

interface TrialFormData {
  trial_number: string;
  trial_name: string;
  protocol_number: string;
  sponsor_name: string;
  phase: string;
  therapeutic_area: string;
  indication: string;
  study_type: string;
  pi_user_id: string;
  site_id: string;
}

interface AddTrialModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const AddTrialModal = ({ visible, onClose, onSuccess }: AddTrialModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TrialFormData>({
    trial_number: '',
    trial_name: '',
    protocol_number: '',
    sponsor_name: '',
    phase: '',
    therapeutic_area: '',
    indication: '',
    study_type: '',
    pi_user_id: '',
    site_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (visible && user) {
      // Auto-populate site_id for site admins
      if (user.site?.id) {
        setFormData((prev) => ({
          ...prev,
          site_id: user.site!.id.toString(),
        }));
      }

      // Fetch sites and users
      if (user.company?.id) {
        fetchSites();
        fetchUsers();
      }
    }
  }, [visible, user]);

  const getAuthToken = async () => {
    return await AsyncStorage.getItem('access_token') || '';
  };

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const token = await getAuthToken();
      const response = await fetch(`${ENV.API_URL}/companies/${user?.company?.id}/sites`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': ENV.API_KEY,
        },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setSites(result.data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = await getAuthToken();
      const response = await fetch(`${ENV.API_URL}/companies/${user?.company?.id}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': ENV.API_KEY,
        },
      });

      const result = await response.json();
      if (result.success && result.data) {
        const eligiblePIs = result.data.filter(
          (u: any) => u.role === 'admin' || u.role === 'site_admin' || u.role === 'trial_lead'
        );
        setUsers(eligiblePIs);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    if (!formData.site_id) {
      Alert.alert('Error', 'Please select a site');
      return;
    }

    if (!formData.trial_number || !formData.trial_name) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getAuthToken();

      const requestBody = {
        site_id: parseInt(formData.site_id),
        trial_number: formData.trial_number,
        trial_name: formData.trial_name,
        protocol_number: formData.protocol_number || undefined,
        sponsor_name: formData.sponsor_name || undefined,
        phase: formData.phase || undefined,
        therapeutic_area: formData.therapeutic_area || undefined,
        indication: formData.indication || undefined,
        study_type: formData.study_type || undefined,
        pi_user_id: formData.pi_user_id ? parseInt(formData.pi_user_id) : undefined,
        created_by_user_id: user.id,
      };

      console.log('[AddTrialModal] Creating trial:', requestBody);

      const response = await fetch(`${ENV.API_URL}/trials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': ENV.API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create trial' }));
        throw new Error(errorData.error || `Failed to create trial (${response.status})`);
      }

      const result = await response.json();
      console.log('[AddTrialModal] Trial created:', result);

      Alert.alert('Success', `Trial ${formData.trial_name} created successfully.`);
      
      // Reset form
      setFormData({
        trial_number: '',
        trial_name: '',
        protocol_number: '',
        sponsor_name: '',
        phase: '',
        therapeutic_area: '',
        indication: '',
        study_type: '',
        pi_user_id: '',
        site_id: user.site?.id?.toString() || '',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating trial:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trial';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add New Trial</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {/* Site */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Site *</Text>
            {user?.site?.id ? (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={`${user.site.number} - ${user.site.name}`}
                editable={false}
              />
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.site_id}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                  enabled={!loadingSites}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a site" value="" />
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

          {/* Trial Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trial Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.trial_number}
              onChangeText={(value) => setFormData({ ...formData, trial_number: value })}
              placeholder="e.g., NCT12345678"
            />
          </View>

          {/* Protocol Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Protocol Number</Text>
            <TextInput
              style={styles.input}
              value={formData.protocol_number}
              onChangeText={(value) => setFormData({ ...formData, protocol_number: value })}
              placeholder="e.g., PROTO-BC-001"
            />
          </View>

          {/* Trial Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trial Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.trial_name}
              onChangeText={(value) => setFormData({ ...formData, trial_name: value })}
              placeholder="e.g., Phase II Breast Cancer Study"
            />
          </View>

          {/* Sponsor */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sponsor</Text>
            <TextInput
              style={styles.input}
              value={formData.sponsor_name}
              onChangeText={(value) => setFormData({ ...formData, sponsor_name: value })}
              placeholder="e.g., Acme Pharma Inc."
            />
          </View>

          {/* Phase */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phase</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.phase}
                onValueChange={(value) => setFormData({ ...formData, phase: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select phase" value="" />
                <Picker.Item label="Phase I" value="Phase I" />
                <Picker.Item label="Phase II" value="Phase II" />
                <Picker.Item label="Phase III" value="Phase III" />
                <Picker.Item label="Phase IV" value="Phase IV" />
              </Picker>
            </View>
          </View>

          {/* Therapeutic Area */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Therapeutic Area</Text>
            <TextInput
              style={styles.input}
              value={formData.therapeutic_area}
              onChangeText={(value) => setFormData({ ...formData, therapeutic_area: value })}
              placeholder="e.g., Oncology"
            />
          </View>

          {/* Study Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Study Type</Text>
            <TextInput
              style={styles.input}
              value={formData.study_type}
              onChangeText={(value) => setFormData({ ...formData, study_type: value })}
              placeholder="e.g., Interventional"
            />
          </View>

          {/* Indication */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Indication</Text>
            <TextInput
              style={styles.input}
              value={formData.indication}
              onChangeText={(value) => setFormData({ ...formData, indication: value })}
              placeholder="e.g., Metastatic Breast Cancer"
            />
          </View>

          {/* Principal Investigator */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Principal Investigator</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.pi_user_id}
                onValueChange={(value) => setFormData({ ...formData, pi_user_id: value })}
                enabled={!loadingUsers}
                style={styles.picker}
              >
                <Picker.Item label="Select PI (optional)" value="" />
                {users.map((u) => (
                  <Picker.Item
                    key={u.user_id}
                    label={`${u.first_name || ''} ${u.last_name || ''} (${u.email})`.trim()}
                    value={u.user_id.toString()}
                  />
                ))}
              </Picker>
            </View>
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
              <Text style={styles.submitButtonText}>Add Trial</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as any,
    color: '#1E3A52',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#1E3A52',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: designTokens.color.accent.green500,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#FFFFFF',
  },
});

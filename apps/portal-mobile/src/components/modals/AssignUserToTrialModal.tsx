import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { trialsService } from '../../services/apiClient';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface AssignUserToTrialModalProps {
  visible: boolean;
  user: {
    user_id: number;
    name: string;
    email: string;
  };
  siteId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
}

export const AssignUserToTrialModal = ({ visible, user, siteId, onClose, onSuccess }: AssignUserToTrialModalProps) => {
  const [trialId, setTrialId] = useState('');
  const [trialRole, setTrialRole] = useState('Site Staff');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loadingTrials, setLoadingTrials] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchTrials();
    }
  }, [visible]);

  const fetchTrials = async () => {
    try {
      setLoadingTrials(true);
      const response = await trialsService.getTrialsBySite(siteId);

      if (response.success && response.data) {
        setTrials(response.data.map((t: any) => ({
          trial_id: t.trial_id,
          trial_number: t.trial_number,
          trial_name: t.trial_name,
        })));
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
    } finally {
      setLoadingTrials(false);
    }
  };

  const handleSubmit = async () => {
    if (!trialId) {
      Alert.alert('Error', 'Please select a trial');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[AssignUserToTrialModal] Assigning user to trial:', {
        trialId,
        userId: user.user_id,
        trialRole,
      });

      const response = await trialsService.assignUserToTrial(
        parseInt(trialId),
        user.user_id,
        trialRole
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign user to trial');
      }

      console.log('[AssignUserToTrialModal] User assigned to trial:', response.data);

      Alert.alert('Success', `${user.name} has been assigned to the trial successfully.`);

      onSuccess();
    } catch (error: any) {
      console.error('[AssignUserToTrialModal] Error:', error);
      Alert.alert('Error', error.message || 'Failed to assign user to trial');
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
          <Text style={styles.title}>Assign User to Trial</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>User:</Text>
            <Text style={styles.infoValue}>{user.name} ({user.email})</Text>
          </View>

          {/* Trial Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trial *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={trialId}
                onValueChange={(value) => setTrialId(value)}
                enabled={!loadingTrials}
                style={styles.picker}
              >
                <Picker.Item label="Select a trial" value="" />
                {trials.map((trial) => (
                  <Picker.Item
                    key={trial.trial_id}
                    label={`${trial.trial_number} - ${trial.trial_name}`}
                    value={trial.trial_id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Trial Role */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trial Role *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={trialRole}
                onValueChange={(value) => setTrialRole(value)}
                style={styles.picker}
              >
                <Picker.Item label="Site Staff" value="Site Staff" />
                <Picker.Item label="Principal Investigator" value="Principal Investigator" />
                <Picker.Item label="Sub-Investigator" value="Sub-Investigator" />
                <Picker.Item label="Clinical Research Coordinator" value="Clinical Research Coordinator" />
                <Picker.Item label="Data Manager" value="Data Manager" />
                <Picker.Item label="Study Coordinator" value="Study Coordinator" />
              </Picker>
            </View>
            <Text style={styles.helperText}>
              Common roles: Principal Investigator, Sub-Investigator, Clinical Research Coordinator, Data Manager, Study Coordinator
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
              <Text style={styles.submitButtonText}>Assign to Trial</Text>
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
  infoSection: {
    backgroundColor: '#F9FAFB',
    padding: designTokens.spacing.m,
    borderRadius: 6,
    marginBottom: designTokens.spacing.l,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.body,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helperText: {
    fontSize: 13,
    color: designTokens.color.text.subtle,
    marginTop: designTokens.spacing.xs,
    fontStyle: 'italic',
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
    minWidth: 160,
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

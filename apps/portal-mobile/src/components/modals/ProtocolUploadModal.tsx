import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/apiClient';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface ProtocolUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  status: string;
}

interface DocumentFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export const ProtocolUploadModal: React.FC<ProtocolUploadModalProps> = ({
  visible,
  onClose,
  onUploadSuccess,
}) => {
  const { user, getToken } = useAuth();
  const [file, setFile] = useState<DocumentFile | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [versionNumber, setVersionNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState('');
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [showTrialPicker, setShowTrialPicker] = useState(false);

  const fetchTrials = useCallback(async () => {
    try {
      setLoadingTrials(true);
      console.log('[ProtocolUpload] Fetching trials for user:', user);
      console.log('[ProtocolUpload] User object:', JSON.stringify(user, null, 2));
      console.log('[ProtocolUpload] User site:', user?.site);
      console.log('[ProtocolUpload] User site.id:', user?.site?.id);

      // Get site_id from user context (it's nested in user.site.id)
      const siteId = user?.site?.id;
      if (!siteId) {
        console.error('[ProtocolUpload] No site_id available');
        console.error('[ProtocolUpload] User structure:', JSON.stringify(user, null, 2));
        Alert.alert('Error', 'No site ID available. Please contact your administrator.');
        return;
      }

      console.log('[ProtocolUpload] Making API call to /trials?site_id=' + siteId);
      const response = await api.get(`/trials?site_id=${siteId}`);
      console.log('[ProtocolUpload] Trials API response:', response);
      console.log('[ProtocolUpload] Response status:', response.status);
      console.log('[ProtocolUpload] Response data:', response.data);

      if (response.data.success && response.data.data) {
        console.log('[ProtocolUpload] Total trials received:', response.data.data.length);
        console.log('[ProtocolUpload] All trials:', JSON.stringify(response.data.data, null, 2));
        
        // Filter to only active trials
        const activeTrials = response.data.data.filter((t: Trial) => t.status === 'active');
        console.log('[ProtocolUpload] Active trials count:', activeTrials.length);
        console.log('[ProtocolUpload] Active trials:', JSON.stringify(activeTrials, null, 2));
        
        setTrials(activeTrials);

        // Auto-select first trial if available
        if (activeTrials.length > 0) {
          setSelectedTrialId(activeTrials[0].trial_id.toString());
          console.log('[ProtocolUpload] Auto-selected trial:', activeTrials[0].trial_id);
        } else {
          console.warn('[ProtocolUpload] No active trials found after filtering');
        }
      } else {
        console.warn('[ProtocolUpload] API response missing success or data fields');
        console.log('[ProtocolUpload] Response structure:', JSON.stringify(response.data, null, 2));
      }
    } catch (error: any) {
      console.error('[ProtocolUpload] Error fetching trials:', error);
      console.error('[ProtocolUpload] Error message:', error.message);
      console.error('[ProtocolUpload] Error response:', error.response);
      Alert.alert('Error', `Failed to load trials: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingTrials(false);
    }
  }, [user]);

  // Fetch trials when modal opens
  useEffect(() => {
    if (visible) {
      fetchTrials();
    }
  }, [visible, fetchTrials]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      console.log('[ProtocolUpload] Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setFile({
          uri: selectedFile.uri,
          name: selectedFile.name,
          mimeType: selectedFile.mimeType,
          size: selectedFile.size,
        });

        // Auto-populate document name from filename if empty
        if (!documentName && selectedFile.name) {
          const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
          setDocumentName(nameWithoutExt);
        }
      }
    } catch (error) {
      console.error('[ProtocolUpload] Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    console.log('[ProtocolUpload] handleSubmit called');
    console.log('[ProtocolUpload] Validation state:', {
      hasFile: !!file,
      hasDocumentName: !!documentName,
      hasVersionNumber: !!versionNumber,
      hasSelectedTrialId: !!selectedTrialId,
      file,
      documentName,
      versionNumber,
      selectedTrialId,
    });

    if (!file || !documentName || !versionNumber || !selectedTrialId) {
      console.warn('[ProtocolUpload] Validation failed - missing required fields');
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.site?.id) {
      console.error('[ProtocolUpload] No site ID available');
      Alert.alert('Error', 'No site ID available. Please contact your administrator.');
      return;
    }

    console.log('[ProtocolUpload] Starting upload with:', {
      fileName: file.name,
      documentName,
      versionNumber,
      siteId: user.site.id,
      trialId: selectedTrialId,
      userId: user?.id,
    });

    setUploading(true);

    try {
      console.log('[ProtocolUpload] Getting auth token...');
      // Get JWT token
      const authToken = await getToken();
      console.log('[ProtocolUpload] Got auth token:', authToken ? 'Yes' : 'No');

      console.log('[ProtocolUpload] Platform:', Platform.OS);
      console.log('[ProtocolUpload] File URI:', file.uri);
      
      // For web platform, we need to fetch the blob from the URI and create a proper File object
      let fileToUpload: any;
      
      if (Platform.OS === 'web') {
        console.log('[ProtocolUpload] Web platform detected - creating File object from blob');
        
        // Fetch the blob from the URI
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        console.log('[ProtocolUpload] Blob created:', {
          size: blob.size,
          type: blob.type,
        });
        
        // Create a proper File object
        fileToUpload = new File([blob], file.name, {
          type: file.mimeType || 'application/pdf',
        });
        
        console.log('[ProtocolUpload] File object created:', {
          name: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
        });
      } else {
        // For native platforms (iOS/Android), use the standard format
        fileToUpload = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        };
        console.log('[ProtocolUpload] Native platform - using URI format');
      }

      // CRITICAL FIX: React Native's FormData has issues with file objects
      // We need to use XMLHttpRequest instead of fetch for proper multipart/form-data handling
      
      console.log('[ProtocolUpload] Creating XMLHttpRequest for file upload');
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = () => {
          console.log('[ProtocolUpload] Upload response status:', xhr.status);
          try {
            const responseData = JSON.parse(xhr.responseText);
            console.log('[ProtocolUpload] Upload response data:', responseData);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              Alert.alert('Success', 'Protocol uploaded successfully');
              
              // Reset form
              setFile(null);
              setDocumentName('');
              setVersionNumber('');
              setSelectedTrialId(trials.length > 0 ? trials[0].trial_id.toString() : '');
              
              // Notify parent to refresh list
              onUploadSuccess();
              onClose();
              resolve(responseData);
            } else {
              const errorMessage = responseData.error || xhr.statusText;
              throw new Error(`Upload failed: ${errorMessage}`);
            }
          } catch (error: any) {
            console.error('[ProtocolUpload] Upload error:', error);
            Alert.alert('Error', error.message || 'Failed to upload protocol');
            reject(error);
          } finally {
            setUploading(false);
          }
        };
        
        xhr.onerror = () => {
          console.error('[ProtocolUpload] Network error during upload');
          Alert.alert('Error', 'Network error during upload');
          setUploading(false);
          reject(new Error('Network error'));
        };
        
        const formData = new FormData();
        
        // XMLHttpRequest with proper File/Blob object (web) or file descriptor (native)
        formData.append('document', fileToUpload);
        
        formData.append('document_type', documentName);
        formData.append('document_version', versionNumber);
        formData.append('site_id', user.site.id.toString());
        formData.append('trial_id', selectedTrialId);

        if (user?.id) {
          formData.append('user_id', user.id.toString());
          console.log('[ProtocolUpload] Adding user_id to upload:', user.id);
        }

        // Log what we're sending
        console.log('[ProtocolUpload] FormData contents:', {
          document: file.name,
          document_type: documentName,
          document_version: versionNumber,
          site_id: user.site.id,
          trial_id: selectedTrialId,
          user_id: user?.id,
        });

        const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
        console.log('[ProtocolUpload] API URL:', API_BASE_URL);
        
        const apiKey = process.env.EXPO_PUBLIC_API_KEY;

        console.log('[ProtocolUpload] Sending upload request to:', `${API_BASE_URL}/document/upload`);
        
        xhr.open('POST', `${API_BASE_URL}/document/upload`);
        
        // Set headers
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }
        if (apiKey) {
          xhr.setRequestHeader('X-API-Key', apiKey);
        }
        
        // DO NOT set Content-Type - XMLHttpRequest will set it automatically with the correct boundary
        
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[ProtocolUpload] Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload protocol');
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      // Reset form
      setFile(null);
      setDocumentName('');
      setVersionNumber('');
      setSelectedTrialId('');
      onClose();
    }
  };

  const selectedTrial = trials.find(t => t.trial_id.toString() === selectedTrialId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload New Protocol</Text>
          <TouchableOpacity
            onPress={handleClose}
            disabled={uploading}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {loadingTrials ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={designTokens.color.accent.green500} />
              <Text style={styles.loadingText}>Loading trials...</Text>
            </View>
          ) : trials.length === 0 ? (
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>⚠️ No Active Trials</Text>
              <Text style={styles.alertText}>
                There are no active trials for this site. Please contact your administrator to create a trial before uploading documents.
              </Text>
            </View>
          ) : null}

          {/* Trial/Study Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Trial/Study <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTrialPicker(!showTrialPicker)}
              disabled={loadingTrials || trials.length === 0}
            >
              <Text style={styles.pickerButtonText}>
                {selectedTrial
                  ? `${selectedTrial.trial_number} - ${selectedTrial.trial_name}`
                  : 'Select a trial...'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
            {showTrialPicker && (
              <View style={styles.pickerList}>
                {trials.map((trial) => (
                  <TouchableOpacity
                    key={trial.trial_id}
                    style={[
                      styles.pickerItem,
                      selectedTrialId === trial.trial_id.toString() && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedTrialId(trial.trial_id.toString());
                      setShowTrialPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>
                      {trial.trial_number} - {trial.trial_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.helpText}>Documents must be associated with a specific trial/study</Text>
          </View>

          {/* Document Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Document Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={documentName}
              onChangeText={setDocumentName}
              placeholder="e.g., Protocol A (Cardiology Study)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Version Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Version Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={versionNumber}
              onChangeText={setVersionNumber}
              placeholder="e.g., V1.0"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Protocol File */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Protocol File <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.filePickerContainer}
              onPress={handlePickDocument}
              disabled={uploading}
            >
              <View style={styles.filePickerContent}>
                <Text style={styles.filePickerButton}>Choose File</Text>
                <Text style={styles.filePickerText}>
                  {file ? file.name : 'No file chosen'}
                </Text>
              </View>
              {file && (
                <Text style={styles.fileSelectedText}>Selected: {file.name}</Text>
              )}
              <Text style={styles.helpText}>Supported formats: PDF, DOC, DOCX</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleClose}
            disabled={uploading}
            style={styles.cancelButton}
            textColor={designTokens.color.text.body}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={uploading || !file || !documentName || !versionNumber || !selectedTrialId || trials.length === 0}
            loading={uploading}
            style={styles.submitButton}
            buttonColor={designTokens.color.accent.green500}
          >
            {uploading ? 'Uploading...' : 'Upload Protocol'}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.l,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: designTokens.color.text.heading,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: designTokens.color.text.subtle,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: designTokens.spacing.l,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designTokens.spacing.l,
    gap: designTokens.spacing.s,
  },
  loadingText: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
  },
  alertContainer: {
    backgroundColor: '#FEF3C7',
    padding: designTokens.spacing.m,
    borderRadius: 8,
    marginBottom: designTokens.spacing.l,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: designTokens.spacing.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: designTokens.color.text.body,
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
    color: designTokens.color.text.body,
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
  },
  pickerList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 200,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  pickerItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  pickerItemText: {
    fontSize: 14,
    color: designTokens.color.text.body,
  },
  helpText: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    marginTop: 4,
  },
  filePickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: designTokens.color.border.subtle,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: designTokens.spacing.m,
  },
  filePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.s,
  },
  filePickerButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.body,
  },
  filePickerText: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
    flex: 1,
  },
  fileSelectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.color.text.body,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: designTokens.spacing.l,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    gap: designTokens.spacing.m,
  },
  cancelButton: {
    borderColor: designTokens.color.border.subtle,
  },
  submitButton: {
    minWidth: 140,
  },
});

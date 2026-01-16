import { useState, useEffect, useCallback } from 'react';
import { useNotify } from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
import { trialsService, protocolDocumentsService } from '../apiClient';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CSpinner,
  CAlert
} from '@coreui/react';

interface ProtocolUploadModalProps {
  isOpen: boolean;
  siteId: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  status: string;
}

export const ProtocolUploadModal = ({ isOpen, siteId, onClose, onUploadSuccess }: ProtocolUploadModalProps) => {
  const notify = useNotify();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [versionNumber, setVersionNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState('');
  const [loadingTrials, setLoadingTrials] = useState(false);

  const fetchTrials = useCallback(async () => {
    try {
      setLoadingTrials(true);

      // Use TrialsService to fetch trials for the site
      const response = await trialsService.getTrials({ siteId });

      if (response.success && response.data) {
        // Filter to only active trials
        const activeTrials = response.data.filter((t: Trial) => t.status === 'active');
        setTrials(activeTrials);

        // Auto-select first trial if available
        if (activeTrials.length > 0) {
          setSelectedTrialId(activeTrials[0].trial_id.toString());
        }
      } else {
        throw new Error(response.error || 'Failed to fetch trials');
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
      notify('Failed to load trials', { type: 'error' });
    } finally {
      setLoadingTrials(false);
    }
  }, [siteId, notify]);

  // Fetch trials when modal opens
  useEffect(() => {
    if (isOpen && siteId) {
      fetchTrials();
    }
  }, [isOpen, siteId, fetchTrials]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Auto-populate document name from filename if empty
      if (!documentName) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !documentName || !versionNumber || !selectedTrialId) {
      notify('Please fill in all required fields', { type: 'warning' });
      return;
    }

    if (!siteId) {
      notify('No site ID available. Please contact your administrator.', { type: 'error' });
      return;
    }

    console.log('[ProtocolUploadModal] Starting upload with:', {
      fileName: file.name,
      documentName,
      versionNumber,
      siteId,
      trialId: selectedTrialId,
      userId: user?.id
    });

    setUploading(true);

    try {
      // Use ProtocolDocumentsService to upload
      const response = await protocolDocumentsService.uploadProtocol({
        document: file,
        document_type: documentName,
        document_version: versionNumber,
        site_id: siteId,
        trial_id: selectedTrialId,
        user_id: user?.id?.toString()
      });

      console.log('[Upload] Response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Upload failed');
      }

      notify('Protocol uploaded successfully', { type: 'success' });

      // Reset form
      setFile(null);
      setDocumentName('');
      setVersionNumber('');
      setSelectedTrialId(trials.length > 0 ? trials[0].trial_id.toString() : '');

      // Notify parent to refresh list
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      notify(error instanceof Error ? error.message : 'Failed to upload protocol', { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <CModal
      size="lg"
      visible={isOpen}
      onClose={onClose}
      backdrop="static"
    >
      <CModalHeader>
        <CModalTitle>Upload New Protocol</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {loadingTrials ? (
            <div className="text-center py-3">
              <CSpinner size="sm" /> Loading trials...
            </div>
          ) : trials.length === 0 ? (
            <CAlert color="warning">
              <strong>No Active Trials:</strong> There are no active trials for this site. Please contact your administrator to create a trial before uploading documents.
            </CAlert>
          ) : null}

          <div className="mb-3">
            <CFormLabel htmlFor="trialSelect">
              Trial/Study <span className="text-danger">*</span>
            </CFormLabel>
            <CFormSelect
              id="trialSelect"
              value={selectedTrialId}
              onChange={(e) => setSelectedTrialId(e.target.value)}
              required
              disabled={loadingTrials || trials.length === 0}
            >
              <option value="">Select a trial...</option>
              {trials.map((trial) => (
                <option key={trial.trial_id} value={trial.trial_id}>
                  {trial.trial_number} - {trial.trial_name}
                </option>
              ))}
            </CFormSelect>
            <div className="form-text small text-muted">
              Documents must be associated with a specific trial/study
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="documentName">
              Document Name <span className="text-danger">*</span>
            </CFormLabel>
            <CFormInput
              type="text"
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., Protocol A (Cardiology Study)"
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="versionNumber">
              Version Number <span className="text-danger">*</span>
            </CFormLabel>
            <CFormInput
              type="text"
              id="versionNumber"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="e.g., V1.0"
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="protocolFile">
              Protocol File <span className="text-danger">*</span>
            </CFormLabel>
            <div className="border-2 border-dashed rounded p-3 text-center bg-light">
              <input
                type="file"
                id="protocolFile"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                required
                className="form-control"
              />
              {file && (
                <div className="small text-secondary mt-2">
                  Selected: <strong>{file.name}</strong>
                </div>
              )}
              <div className="small text-muted mt-1">
                Supported formats: PDF, DOC, DOCX
              </div>
            </div>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            type="submit"
            disabled={uploading || !file || !documentName || !versionNumber || !selectedTrialId || trials.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Protocol'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

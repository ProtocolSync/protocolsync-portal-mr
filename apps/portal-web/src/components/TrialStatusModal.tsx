import { useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CFormLabel,
  CAlert,
  CBadge
} from '@coreui/react';
import { trialsService } from '../apiClient';

interface TrialStatusModalProps {
  visible: boolean;
  onClose: () => void;
  trial: {
    trial_id: number;
    trial_number: string;
    trial_name: string;
    status: string;
  };
}

export const TrialStatusModal = ({ visible, onClose, trial }: TrialStatusModalProps) => {
  const { user } = useAuth();
  const notify = useNotify();
  const refresh = useRefresh();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = trial.status === 'active';
  const newStatus = isActive ? 'paused' : 'active';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('User information not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use TrialsService to update trial status
      const response = await trialsService.updateTrial(trial.trial_id, {
        status: newStatus
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update trial status');
      }

      console.log('[TrialStatusModal] Trial status updated:', response.data);

      notify(
        `Trial ${trial.trial_number} ${isActive ? 'paused' : 'activated'} successfully.`,
        { type: 'success' }
      );

      refresh();
      onClose();
    } catch (error) {
      console.error('Error updating trial status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update trial status';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      backdrop="static"
    >
      <CModalHeader>
        <CModalTitle>
          {isActive ? 'Pause' : 'Activate'} Trial
        </CModalTitle>
      </CModalHeader>

      <form onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <strong>Trial:</strong> {trial.trial_number} - {trial.trial_name}
          </div>

          <div className="mb-3">
            <strong>Current Status:</strong>{' '}
            <CBadge color={isActive ? 'success' : 'warning'}>
              {trial.status}
            </CBadge>
          </div>

          <div className="mb-3">
            <strong>New Status:</strong>{' '}
            <CBadge color={isActive ? 'warning' : 'success'}>
              {newStatus}
            </CBadge>
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="reason">
              Reason {isActive ? '(Required for pausing)' : '(Optional)'}
            </CFormLabel>
            <CFormTextarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isActive
                  ? 'Please provide a reason for pausing this trial (e.g., "On hold pending IRB approval")'
                  : 'Optional: Provide a reason for reactivating this trial'
              }
              required={isActive}
            />
            {isActive && (
              <div className="form-text">
                This action will prevent new documents from being uploaded to this trial until it is reactivated.
              </div>
            )}
          </div>

          <CAlert color="warning" className="mb-0">
            <strong>Note:</strong> This action will be logged in the trial audit trail for compliance purposes.
          </CAlert>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton
            color={isActive ? 'warning' : 'success'}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Updating...'
              : isActive
              ? 'Pause Trial'
              : 'Activate Trial'}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  );
};

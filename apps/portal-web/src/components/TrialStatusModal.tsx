import { useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';
import { useUser } from '../contexts/UserContext';
import { useMsal } from '@azure/msal-react';
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

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const TrialStatusModal = ({ visible, onClose, trial }: TrialStatusModalProps) => {
  const { user } = useUser();
  const { instance } = useMsal();
  const notify = useNotify();
  const refresh = useRefresh();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = trial.status === 'active';
  const newStatus = isActive ? 'paused' : 'active';

  const getAuthToken = async () => {
    const accounts = instance.getAllAccounts();
    if (accounts.length === 0) return '';

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('User information not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/trials/${trial.trial_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
          updated_by_user_id: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to update trial status'
        }));
        throw new Error(errorData.error || `Failed to update trial status (${response.status})`);
      }

      const result = await response.json();
      console.log('[TrialStatusModal] Trial status updated:', result);

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

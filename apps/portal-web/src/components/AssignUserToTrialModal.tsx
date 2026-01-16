import { useState, useEffect } from 'react';
import { useNotify } from 'react-admin';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CAlert,
  CSpinner
} from '@coreui/react';
import { trialsService } from '../apiClient';

interface AssignUserToTrialModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    user_id: number;
    name: string;
    email: string;
    trial_assignments?: Array<{
      trial_id: number;
      trial_role: string;
    }>;
  };
  siteId: number;
}

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
}

export const AssignUserToTrialModal = ({
  visible,
  onClose,
  onSuccess,
  user,
  siteId
}: AssignUserToTrialModalProps) => {
  const notify = useNotify();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Site Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<number[]>([]);

  // Fetch trials for this site and user's current assignments
  useEffect(() => {
    if (visible && siteId && user) {
      fetchTrials();
      // Get current trial assignments from user object
      const assignedTrialIds = (user.trial_assignments || []).map((t: any) => t.trial_id);
      setCurrentAssignments(assignedTrialIds);
    }
  }, [visible, siteId, user]);

  const fetchTrials = async () => {
    try {
      setLoadingTrials(true);

      // Use TrialsService to fetch trials for this site
      const response = await trialsService.getTrials({ siteId });

      if (response.success && response.data) {
        // Filter to only active trials
        const activeTrials = response.data.filter((t: any) => t.status === 'active');
        setTrials(activeTrials);
      } else {
        throw new Error(response.error || 'Failed to fetch trials');
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
      notify('Failed to load trials', { type: 'error' });
    } finally {
      setLoadingTrials(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTrialId) {
      setError('Please select a trial');
      return;
    }

    // Check if user is already assigned with the same role
    const trialId = parseInt(selectedTrialId);
    const existingAssignment = (user.trial_assignments || []).find(
      (t: any) => t.trial_id === trialId
    );

    if (existingAssignment && existingAssignment.trial_role === selectedRole) {
      setError(`User is already assigned to this trial with the role "${selectedRole}". Please select a different role to update.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use TrialsService to assign user to trial
      const response = await trialsService.assignUserToTrial(
        selectedTrialId,
        user.user_id,
        selectedRole
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign user to trial');
      }

      console.log('[AssignUserToTrialModal] User assigned:', response.data);

      const isUpdate = currentAssignments.includes(parseInt(selectedTrialId));
      const message = isUpdate
        ? `${user.name}'s role updated successfully.`
        : `${user.name} assigned to trial successfully.`;

      notify(message, { type: 'success' });
      setSelectedTrialId('');
      setSelectedRole('Site Staff');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning user to trial:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign user';
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
        <CModalTitle>Assign User to Trial</CModalTitle>
      </CModalHeader>

      <form onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <strong>User:</strong> {user.name} ({user.email})
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="trial_id">Trial *</CFormLabel>
            <CFormSelect
              id="trial_id"
              required
              value={selectedTrialId}
              onChange={(e) => {
                setSelectedTrialId(e.target.value);
                // Pre-fill role if user is already assigned
                const trialId = parseInt(e.target.value);
                const existingAssignment = (user.trial_assignments || []).find(
                  (t: any) => t.trial_id === trialId
                );
                if (existingAssignment) {
                  setSelectedRole(existingAssignment.trial_role);
                } else {
                  setSelectedRole('Site Staff');
                }
              }}
              disabled={loadingTrials}
            >
              <option value="">
                {loadingTrials ? 'Loading trials...' : 'Select a trial'}
              </option>
              {trials.map((trial) => {
                const isAssigned = currentAssignments.includes(trial.trial_id);
                const assignment = (user.trial_assignments || []).find(
                  (t: any) => t.trial_id === trial.trial_id
                );
                return (
                  <option key={trial.trial_id} value={trial.trial_id}>
                    {trial.trial_number} - {trial.trial_name}
                    {isAssigned ? ` (Current: ${assignment?.trial_role || 'Unknown'})` : ''}
                  </option>
                );
              })}
            </CFormSelect>
            {trials.length === 0 && !loadingTrials && (
              <div className="form-text text-warning">
                No active trials available at this site. Create a trial first.
              </div>
            )}
            {selectedTrialId && currentAssignments.includes(parseInt(selectedTrialId)) && (
              <div className="form-text text-info">
                This user is already assigned to this trial. You can update their role below.
              </div>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="trial_role">Trial Role *</CFormLabel>
            <CFormInput
              type="text"
              id="trial_role"
              required
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              placeholder="e.g., Principal Investigator, Sub-Investigator, CRC, etc."
            />
            <div className="form-text">
              Common roles: Principal Investigator, Sub-Investigator, Clinical Research Coordinator, Data Manager, Study Coordinator
            </div>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            type="submit"
            disabled={isSubmitting || trials.length === 0}
          >
            {isSubmitting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {selectedTrialId && currentAssignments.includes(parseInt(selectedTrialId)) ? 'Updating...' : 'Assigning...'}
              </>
            ) : (
              selectedTrialId && currentAssignments.includes(parseInt(selectedTrialId)) ? 'Update Role' : 'Assign to Trial'
            )}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  );
};

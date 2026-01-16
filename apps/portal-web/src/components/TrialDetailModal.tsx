import { useState, useEffect } from 'react';
import { useNotify } from 'react-admin';
import { useMsal } from '@azure/msal-react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CBadge,
  CRow,
  CCol
} from '@coreui/react';
import { apiScopes } from '../authConfig';

interface TrialDetailModalProps {
  trialId: number;
  onClose: () => void;
}

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  protocol_number?: string;
  sponsor_name?: string;
  phase?: string;
  therapeutic_area?: string;
  indication?: string;
  study_type?: string;
  status: string;
  pi_name?: string;
  site_name: string;
  site_number: string;
  assigned_user_count: number;
  document_count: number;
  created_at: string;
  record_hash?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const TrialDetailModal = ({ trialId, onClose }: TrialDetailModalProps) => {
  const { instance } = useMsal();
  const notify = useNotify();
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthToken = async () => {
    const accounts = instance.getAllAccounts();
    if (accounts.length === 0) return '';

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: apiScopes,
        account: accounts[0]
      });
      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      return '';
    }
  };

  useEffect(() => {
    fetchTrialDetails();
  }, [trialId]);

  const fetchTrialDetails = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/trials/${trialId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial details');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setTrial(result.data);
      }
    } catch (error) {
      console.error('Error fetching trial details:', error);
      notify('Failed to load trial details', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'closed':
        return 'secondary';
      case 'completed':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getPhaseColor = (phase?: string) => {
    if (!phase) return 'secondary';
    switch (phase.toLowerCase()) {
      case 'phase i':
        return 'info';
      case 'phase ii':
        return 'primary';
      case 'phase iii':
        return 'warning';
      case 'phase iv':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <CModal
      size="lg"
      visible={true}
      onClose={onClose}
      backdrop="static"
    >
      <CModalHeader>
        <CModalTitle>Trial Details</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {loading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" />
            <p className="mt-2">Loading trial details...</p>
          </div>
        ) : trial ? (
          <div>
            {/* Header Info */}
            <div className="mb-4">
              <h5 className="mb-2">{trial.trial_name}</h5>
              <div className="d-flex gap-2 mb-3">
                <CBadge color={getStatusColor(trial.status)} size="sm">
                  {trial.status}
                </CBadge>
                {trial.phase && (
                  <CBadge color={getPhaseColor(trial.phase)} size="sm">
                    {trial.phase}
                  </CBadge>
                )}
              </div>
            </div>

            {/* Trial Information */}
            <CRow className="mb-3">
              <CCol md={6}>
                <div className="mb-3">
                  <strong className="text-muted small d-block">Trial Number</strong>
                  <div>{trial.trial_number}</div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <strong className="text-muted small d-block">Protocol Number</strong>
                  <div>{trial.protocol_number || '-'}</div>
                </div>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <div className="mb-3">
                  <strong className="text-muted small d-block">Site</strong>
                  <div>{trial.site_number} - {trial.site_name}</div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <strong className="text-muted small d-block">Principal Investigator</strong>
                  <div>{trial.pi_name || 'Not assigned'}</div>
                </div>
              </CCol>
            </CRow>

            {/* Study Details */}
            {(trial.sponsor_name || trial.therapeutic_area || trial.study_type) && (
              <>
                <hr />
                <h6 className="mb-3">Study Details</h6>
                <CRow className="mb-3">
                  {trial.sponsor_name && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Sponsor</strong>
                        <div>{trial.sponsor_name}</div>
                      </div>
                    </CCol>
                  )}
                  {trial.therapeutic_area && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Therapeutic Area</strong>
                        <div>{trial.therapeutic_area}</div>
                      </div>
                    </CCol>
                  )}
                </CRow>
                <CRow className="mb-3">
                  {trial.indication && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Indication</strong>
                        <div>{trial.indication}</div>
                      </div>
                    </CCol>
                  )}
                  {trial.study_type && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Study Type</strong>
                        <div>{trial.study_type}</div>
                      </div>
                    </CCol>
                  )}
                </CRow>
              </>
            )}

            {/* Team & Documents */}
            <hr />
            <h6 className="mb-3">Trial Summary</h6>
            <CRow className="mb-3">
              <CCol md={6}>
                <div className="mb-3">
                  <strong className="text-muted small d-block">Team Members</strong>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded bg-indigo-100 text-indigo-800 font-medium">
                      {trial.assigned_user_count} {trial.assigned_user_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <strong className="text-muted small d-block">Documents</strong>
                  <div>{trial.document_count || 0} documents</div>
                </div>
              </CCol>
            </CRow>

            {/* Metadata */}
            <hr />
            <div className="mb-3">
              <strong className="text-muted small d-block">Created</strong>
              <div>{formatDate(trial.created_at)}</div>
            </div>

            {/* Record Hash for 21 CFR Part 11 Compliance */}
            {trial.record_hash && (
              <div className="mb-3">
                <strong className="text-muted small d-block">Record Hash (21 CFR Part 11)</strong>
                <div className="font-mono text-xs break-all text-text-subtle bg-background-subtle p-2 rounded border border-border-light">
                  {trial.record_hash}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">Trial not found</p>
          </div>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

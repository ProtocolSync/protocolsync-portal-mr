import { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CFormLabel,
  CAlert
} from '@coreui/react';
import { useUser } from '../contexts/UserContext';
import { useNotify, useRefresh } from 'react-admin';
import { sitesService } from '../apiClient';

interface SiteStatusModalProps {
  visible: boolean;
  onClose: () => void;
  site: {
    site_id: number;
    site_number: string;
    site_name: string;
    status: string;
  };
}

export const SiteStatusModal = ({ visible, onClose, site }: SiteStatusModalProps) => {
  const { user } = useUser();
  const notify = useNotify();
  const refresh = useRefresh();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newStatus = site.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? 'Enable' : 'Disable';
  const actionLower = action.toLowerCase();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('A reason is required for 21 CFR Part 11 compliance');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await sitesService.updateSiteStatus(site.site_id, {
        status: newStatus,
        reason: reason.trim(),
        performed_by_user_id: parseInt(user?.id || '0')
      });

      if (response.success) {
        notify(
          `Site ${actionLower}d successfully. All changes are logged for compliance.`,
          { type: 'success' }
        );
        refresh();
        onClose();
      } else {
        setError(response.error || `Failed to ${actionLower} site`);
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${actionLower} site`;
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <CModal visible={visible} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>{action} Site: {site.site_number}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <p>
            <strong>Site Name:</strong> {site.site_name}
          </p>
          <p>
            <strong>Current Status:</strong>{' '}
            <span className={`badge bg-${site.status === 'active' ? 'success' : 'secondary'}`}>
              {site.status}
            </span>
          </p>
          <p>
            <strong>New Status:</strong>{' '}
            <span className={`badge bg-${newStatus === 'active' ? 'success' : 'secondary'}`}>
              {newStatus}
            </span>
          </p>
        </div>

        {newStatus === 'inactive' && (
          <CAlert color="warning" className="mb-3">
            <strong>Important:</strong> When a site is disabled:
            <ul className="mb-0 mt-2">
              <li>Users will not be able to upload new documents to this site</li>
              <li>The site will not count against your subscription limits</li>
              <li>All existing data remains accessible for viewing</li>
              <li>This action is fully auditable per 21 CFR Part 11</li>
            </ul>
          </CAlert>
        )}

        {newStatus === 'active' && (
          <CAlert color="info" className="mb-3">
            <strong>Note:</strong> Enabling this site will:
            <ul className="mb-0 mt-2">
              <li>Allow users to upload new documents</li>
              <li>Count the site against your subscription limits</li>
              <li>This action is fully auditable per 21 CFR Part 11</li>
            </ul>
          </CAlert>
        )}

        <div className="mb-3">
          <CFormLabel htmlFor="reason">
            Reason for Status Change <span className="text-danger">*</span>
            <small className="text-muted d-block">
              Required for 21 CFR Part 11 compliance and audit trail
            </small>
          </CFormLabel>
          <CFormTextarea
            id="reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`e.g., "Site temporarily closed for facility maintenance" or "Site reopening after equipment upgrade"`}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <CAlert color="danger" className="mb-0">
            {error}
          </CAlert>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </CButton>
        <CButton
          color={newStatus === 'active' ? 'success' : 'warning'}
          onClick={handleSubmit}
          disabled={isSubmitting || !reason.trim()}
        >
          {isSubmitting ? `${action}ing...` : `${action} Site`}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

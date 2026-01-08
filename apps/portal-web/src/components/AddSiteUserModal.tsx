import { useState } from 'react';
import { useNotify } from 'react-admin';
import { useUser } from '../contexts/UserContext';
import { useMsal } from '@azure/msal-react';
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
  CAlert
} from '@coreui/react';

interface SiteUserFormData {
  email: string;
  name: string;
  job_title: string;
}

interface AddSiteUserModalProps {
  visible: boolean;
  siteId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AddSiteUserModal = ({ visible, siteId, onClose, onSuccess }: AddSiteUserModalProps) => {
  const { user } = useUser();
  const { instance } = useMsal();
  const notify = useNotify();
  const [formData, setFormData] = useState<SiteUserFormData>({
    email: '',
    name: '',
    job_title: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      const requestBody = {
        email: formData.email,
        name: formData.name,
        job_title: formData.job_title,
        provisioned_by_user_id: user.id
      };
      
      console.log('[AddSiteUserModal] Provisioning site user for site:', siteId);
      console.log('[AddSiteUserModal] Request body:', requestBody);

      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/users/provision`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add site user' }));
        throw new Error(errorData.error || `Failed to add site user (${response.status})`);
      }
      
      const result = await response.json();
      console.log('[AddSiteUserModal] Site user provisioned:', result);
      
      notify(`User ${formData.email} provisioned successfully. They will receive an invitation email.`, { type: 'success' });
      setFormData({ email: '', name: '', job_title: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding site user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add site user';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SiteUserFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <CModal
      size="lg"
      visible={visible}
      onClose={onClose}
      backdrop="static"
    >
      <CModalHeader>
        <CModalTitle>Add Site User</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="email">Email *</CFormLabel>
            <CFormInput
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="name">Full Name *</CFormLabel>
            <CFormInput
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="job_title">Job Title</CFormLabel>
            <CFormInput
              type="text"
              id="job_title"
              value={formData.job_title}
              onChange={(e) => handleChange('job_title', e.target.value)}
              placeholder="Clinical Research Coordinator"
            />
          </div>

          <CAlert color="info" className="d-flex align-items-center">
            <small>
              ℹ️ User will be added to this site and receive an Entra ID invitation email. They must complete registration before they can log in.
            </small>
          </CAlert>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Site User...' : 'Add Site User'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

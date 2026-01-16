import { useState, useEffect } from 'react';
import { useNotify } from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
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
  CFormSelect,
  CAlert,
  CSpinner
} from '@coreui/react';
import { apiScopes } from '../authConfig';

interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
}

interface AdminFormData {
  email: string;
  full_name: string;
  job_title: string;
  site_id: number | null;
}

interface AddSiteAdministratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AddSiteAdministratorModal = ({ visible, onClose, onSuccess }: AddSiteAdministratorModalProps) => {
  const { user } = useAuth();
  const { instance } = useMsal();
  const notify = useNotify();
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [formData, setFormData] = useState<AdminFormData>({
    email: '',
    full_name: '',
    job_title: '',
    site_id: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch sites for the dropdown
  useEffect(() => {
    const fetchSites = async () => {
      if (!user?.company?.id) return;

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
        const response = await fetch(`${API_BASE_URL}/companies/${user.company.id}/sites`, { headers });

        if (!response.ok) {
          throw new Error('Failed to fetch sites');
        }

        const data = await response.json();
        const siteList = Array.isArray(data) ? data : (data.data || data.sites || []);
        setSites(siteList);
      } catch (error) {
        console.error('Error fetching sites:', error);
        notify('Failed to load sites', { type: 'error' });
      } finally {
        setLoadingSites(false);
      }
    };

    fetchSites();
  }, [user?.company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.company?.id || !user?.id) {
      setError('Company information not available');
      return;
    }

    if (!formData.site_id) {
      setError('Please select a site');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const companyId = user.company.id;
      const siteId = formData.site_id;
      
      // Split full name into first and last name
      const nameParts = formData.full_name.trim().split(' ');
      const firstName = nameParts[0] || formData.full_name;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const requestBody = {
        admin_email: formData.email,
        admin_first_name: firstName,
        admin_last_name: lastName,
        admin_job_title: formData.job_title,
        assigned_by_user_id: user.id,
        requester_role: 'admin'
      };
      
      console.log('[AddSiteAdministratorModal] Adding administrator for company:', companyId, 'site:', siteId);
      console.log('[AddSiteAdministratorModal] Request body:', requestBody);

      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/sites/${siteId}/administrator`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add administrator' }));
        throw new Error(errorData.error || `Failed to add administrator (${response.status})`);
      }
      
      const result = await response.json();
      console.log('[AddSiteAdministratorModal] Administrator added:', result);
      
      notify(`Site administrator ${formData.email} added successfully. They will receive an invitation email.`, { type: 'success' });
      setFormData({ email: '', full_name: '', job_title: '', site_id: null });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding site administrator:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add site administrator';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof AdminFormData, value: string | number) => {
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
        <CModalTitle>Add Site Administrator</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          {loadingSites ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading sites...</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <CFormLabel htmlFor="email">Email *</CFormLabel>
                <CFormInput
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="full_name">Full Name *</CFormLabel>
                <CFormInput
                  type="text"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Dr. Jane Smith"
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="job_title">Job Title</CFormLabel>
                <CFormInput
                  type="text"
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                  placeholder="Principal Investigator"
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="site_id">Assign to Site *</CFormLabel>
                <CFormSelect
                  id="site_id"
                  required
                  value={formData.site_id || ''}
                  onChange={(e) => handleChange('site_id', parseInt(e.target.value))}
                >
                  <option value="">Select a site...</option>
                  {sites.map(site => (
                    <option key={site.site_id} value={site.site_id}>
                      {site.site_name} ({site.site_number})
                    </option>
                  ))}
                </CFormSelect>
                {sites.length === 0 && !loadingSites && (
                  <small className="text-danger d-block mt-1">
                    No sites available. Please create a site first.
                  </small>
                )}
              </div>

              <CAlert color="info" className="d-flex align-items-center">
                <small>
                  ℹ️ This user will be assigned as a Site Administrator for the selected site. They will receive an Entra ID invitation email.
                </small>
              </CAlert>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit" disabled={isSubmitting || sites.length === 0}>
            {isSubmitting ? 'Adding Administrator...' : 'Add Administrator'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

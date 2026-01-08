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
  CRow,
  CCol,
  CAlert
} from '@coreui/react';

interface SiteFormData {
  site_number: string;
  site_name: string;
  institution_name: string;
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

interface AddSiteModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AddSiteModal = ({ visible, onClose, onSuccess }: AddSiteModalProps) => {
  const { user } = useUser();
  const { instance } = useMsal();
  const notify = useNotify();
  const [formData, setFormData] = useState<SiteFormData>({
    site_number: '',
    site_name: '',
    institution_name: '',
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States'
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
    
    if (!user?.company?.id || !user?.id) {
      setError('Company information not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const companyId = user.company.id;
      
      const requestBody = {
        ...formData,
        created_by_user_id: user.id
      };
      
      console.log('[AddSiteModal] Creating site for company:', companyId);
      console.log('[AddSiteModal] Request body:', requestBody);
      
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/sites`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create site' }));
        throw new Error(errorData.error || `Failed to create site (${response.status})`);
      }
      
      const result = await response.json();
      console.log('[AddSiteModal] Site created:', result);
      
      notify(`Site ${formData.site_name} created successfully.`, { type: 'success' });
      setFormData({
        site_number: '',
        site_name: '',
        institution_name: '',
        address_line1: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'United States'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating site:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create site';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SiteFormData, value: string) => {
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
        <CModalTitle>Add New Site</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {/* Error Message */}
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="site_number">Site Number *</CFormLabel>
            <CFormInput
              type="text"
              id="site_number"
              required
              value={formData.site_number}
              onChange={(e) => handleChange('site_number', e.target.value)}
              placeholder="e.g., SITE-004"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="site_name">Site Name *</CFormLabel>
            <CFormInput
              type="text"
              id="site_name"
              required
              value={formData.site_name}
              onChange={(e) => handleChange('site_name', e.target.value)}
              placeholder="e.g., Boston Medical Center - Oncology"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="institution_name">Institution Name *</CFormLabel>
            <CFormInput
              type="text"
              id="institution_name"
              required
              value={formData.institution_name}
              onChange={(e) => handleChange('institution_name', e.target.value)}
              placeholder="e.g., Boston Medical Center"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="address_line1">Address *</CFormLabel>
            <CFormInput
              type="text"
              id="address_line1"
              required
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              placeholder="e.g., 123 Medical Plaza"
            />
          </div>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="city">City *</CFormLabel>
              <CFormInput
                type="text"
                id="city"
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g., Boston"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel htmlFor="state_province">State/Province *</CFormLabel>
              <CFormInput
                type="text"
                id="state_province"
                required
                value={formData.state_province}
                onChange={(e) => handleChange('state_province', e.target.value)}
                placeholder="e.g., MA"
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="postal_code">Postal Code *</CFormLabel>
              <CFormInput
                type="text"
                id="postal_code"
                required
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="e.g., 02101"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel htmlFor="country">Country *</CFormLabel>
              <CFormInput
                type="text"
                id="country"
                required
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="e.g., United States"
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Site...' : 'Add Site'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

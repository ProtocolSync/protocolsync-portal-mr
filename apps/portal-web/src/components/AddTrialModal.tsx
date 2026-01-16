import { useState, useEffect } from 'react';
import { useNotify } from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
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
  CRow,
  CCol,
  CAlert
} from '@coreui/react';
import { sitesService, usersService, trialsService } from '../apiClient';

interface TrialFormData {
  trial_number: string;
  trial_name: string;
  protocol_number: string;
  sponsor_name: string;
  phase: string;
  therapeutic_area: string;
  indication: string;
  study_type: string;
  pi_user_id: string;
  site_id: string;
}

interface AddTrialModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
}

interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
}

export const AddTrialModal = ({ visible, onClose, onSuccess }: AddTrialModalProps) => {
  const { user } = useAuth();
  const notify = useNotify();
  const [formData, setFormData] = useState<TrialFormData>({
    trial_number: '',
    trial_name: '',
    protocol_number: '',
    sponsor_name: '',
    phase: '',
    therapeutic_area: '',
    indication: '',
    study_type: '',
    pi_user_id: '',
    site_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Auto-populate site_id for site admins when modal opens
  useEffect(() => {
    if (visible && user) {
      // If user has a site assigned (site admin), auto-populate the site_id
      if (user.site?.id) {
        setFormData(prev => ({
          ...prev,
          site_id: user.site!.id
        }));
      }

      // Fetch sites and users
      if (user.company?.id) {
        fetchSites();
        fetchUsers();
      }
    }
  }, [visible, user]);

  const fetchSites = async () => {
    try {
      setLoadingSites(true);

      // Use SitesService to fetch sites for company
      const response = await sitesService.getSitesByCompany(user?.company?.id || '');

      if (response.success && response.data) {
        setSites(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch sites');
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      notify('Failed to load sites', { type: 'error' });
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      // Use UsersService to fetch users for company
      const response = await usersService.getCompanyUsers(user?.company?.id || '');

      if (response.success && response.data) {
        // Filter for users who can be PIs (admin, site_admin, or trial_lead roles)
        const eligiblePIs = response.data.filter((u: any) =>
          u.role === 'admin' || u.role === 'site_admin' || u.role === 'trial_lead'
        );
        setUsers(eligiblePIs);
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      notify('Failed to load users', { type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('User information not available');
      return;
    }

    if (!formData.site_id) {
      setError('Please select a site');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestBody = {
        site_id: parseInt(formData.site_id),
        trial_number: formData.trial_number,
        trial_name: formData.trial_name,
        protocol_number: formData.protocol_number || undefined,
        sponsor_name: formData.sponsor_name || undefined,
        phase: formData.phase || undefined,
        therapeutic_area: formData.therapeutic_area || undefined,
        indication: formData.indication || undefined,
        study_type: formData.study_type || undefined,
        pi_user_id: formData.pi_user_id ? parseInt(formData.pi_user_id) : undefined,
        created_by_user_id: parseInt(user.id.toString()),
        status: 'active' as const
      };

      console.log('[AddTrialModal] Creating trial for site:', formData.site_id);
      console.log('[AddTrialModal] Request body:', requestBody);

      // Use TrialsService to create trial
      const response = await trialsService.createTrial(requestBody);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create trial');
      }

      console.log('[AddTrialModal] Trial created:', response.data);

      notify(`Trial ${formData.trial_name} created successfully.`, { type: 'success' });
      setFormData({
        trial_number: '',
        trial_name: '',
        protocol_number: '',
        sponsor_name: '',
        phase: '',
        therapeutic_area: '',
        indication: '',
        study_type: '',
        pi_user_id: '',
        site_id: ''
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating trial:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trial';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TrialFormData, value: string) => {
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
        <CModalTitle>Add New Trial</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="site_id">Site *</CFormLabel>
            {user?.site?.id ? (
              // Site Admin - show read-only site info
              <CFormInput
                type="text"
                id="site_id"
                value={`${user.site.number} - ${user.site.name}`}
                disabled
                readOnly
              />
            ) : (
              // CRO Admin - show dropdown to select site
              <CFormSelect
                id="site_id"
                required
                value={formData.site_id}
                onChange={(e) => handleChange('site_id', e.target.value)}
                disabled={loadingSites}
              >
                <option value="">
                  {loadingSites ? 'Loading sites...' : 'Select a site'}
                </option>
                {sites.map((site) => (
                  <option key={site.site_id} value={site.site_id}>
                    {site.site_number} - {site.site_name}
                  </option>
                ))}
              </CFormSelect>
            )}
          </div>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="trial_number">Trial Number *</CFormLabel>
              <CFormInput
                type="text"
                id="trial_number"
                required
                value={formData.trial_number}
                onChange={(e) => handleChange('trial_number', e.target.value)}
                placeholder="e.g., NCT12345678"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel htmlFor="protocol_number">Protocol Number</CFormLabel>
              <CFormInput
                type="text"
                id="protocol_number"
                value={formData.protocol_number}
                onChange={(e) => handleChange('protocol_number', e.target.value)}
                placeholder="e.g., PROTO-BC-001"
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="trial_name">Trial Name *</CFormLabel>
            <CFormInput
              type="text"
              id="trial_name"
              required
              value={formData.trial_name}
              onChange={(e) => handleChange('trial_name', e.target.value)}
              placeholder="e.g., Phase II Breast Cancer Study"
            />
          </div>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="sponsor_name">Sponsor</CFormLabel>
              <CFormInput
                type="text"
                id="sponsor_name"
                value={formData.sponsor_name}
                onChange={(e) => handleChange('sponsor_name', e.target.value)}
                placeholder="e.g., Acme Pharma Inc."
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel htmlFor="phase">Phase</CFormLabel>
              <CFormSelect
                id="phase"
                value={formData.phase}
                onChange={(e) => handleChange('phase', e.target.value)}
              >
                <option value="">Select phase</option>
                <option value="Phase I">Phase I</option>
                <option value="Phase II">Phase II</option>
                <option value="Phase III">Phase III</option>
                <option value="Phase IV">Phase IV</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="therapeutic_area">Therapeutic Area</CFormLabel>
              <CFormInput
                type="text"
                id="therapeutic_area"
                value={formData.therapeutic_area}
                onChange={(e) => handleChange('therapeutic_area', e.target.value)}
                placeholder="e.g., Oncology"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel htmlFor="study_type">Study Type</CFormLabel>
              <CFormInput
                type="text"
                id="study_type"
                value={formData.study_type}
                onChange={(e) => handleChange('study_type', e.target.value)}
                placeholder="e.g., Interventional"
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="indication">Indication</CFormLabel>
            <CFormInput
              type="text"
              id="indication"
              value={formData.indication}
              onChange={(e) => handleChange('indication', e.target.value)}
              placeholder="e.g., Metastatic Breast Cancer"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="pi_user_id">Principal Investigator</CFormLabel>
            <CFormSelect
              id="pi_user_id"
              value={formData.pi_user_id}
              onChange={(e) => handleChange('pi_user_id', e.target.value)}
              disabled={loadingUsers}
            >
              <option value="">
                {loadingUsers ? 'Loading users...' : 'Select PI (optional)'}
              </option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </CFormSelect>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Trial...' : 'Add Trial'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

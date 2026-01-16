import { useState, useEffect } from 'react';
import { useNotify } from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
import { usersService, sitesService } from '../apiClient';
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

interface UserFormData {
  role: string;
  email: string;
  name: string;
  job_title: string;
  site_id: string;
}

interface Site {
  site_id: number;
  site_name: string;
  site_number: string;
  institution_name: string;
}

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddUserModal = ({ visible, onClose, onSuccess }: AddUserModalProps) => {
  const { user } = useAuth();
  const notify = useNotify();
  const [formData, setFormData] = useState<UserFormData>({
    role: 'site_user',
    email: '',
    name: '',
    job_title: '',
    site_id: ''
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    if (!user?.company?.id) return;

    setLoadingSites(true);
    try {
      const response = await sitesService.getSites(user.company.id);

      if (response.success && response.data) {
        setSites(response.data);
      } else {
        console.error('Failed to fetch sites:', response.error);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoadingSites(false);
    }
  };

  // Fetch sites when modal opens
  useEffect(() => {
    if (visible && user?.company?.id) {
      fetchSites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user?.company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.company?.id || !user?.id) {
      setError('Company information not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const companyId = user.company.id;

      const userData = {
        email: formData.email,
        name: formData.name,
        job_title: formData.job_title,
        role: formData.role
      };

      console.log('[AddUserModal] Creating user for company:', companyId);
      console.log('[AddUserModal] User data:', userData);

      const response = await usersService.createUser(companyId, userData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to add user');
      }

      console.log('[AddUserModal] User created:', response.data);

      const successMessage = formData.site_id
        ? `User ${formData.email} added to site successfully. They will receive an invitation email.`
        : `User ${formData.email} created successfully. They will receive an invitation email.`;

      notify(successMessage, { type: 'success' });
      setFormData({ role: 'site_user', email: '', name: '', job_title: '', site_id: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add user';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
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
        <CModalTitle>Add New User</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="role">Organization Role *</CFormLabel>
            <CFormSelect
              id="role"
              required
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="site_user">Site User</option>
              <option value="trial_lead">Trial Lead</option>
              <option value="site_admin">Site Administrator</option>
            </CFormSelect>
            <small className="text-muted">
              Site Users participate in trials. Trial Leads manage protocol versions and delegations for their trials. Site Administrators manage trials and site users.
            </small>
          </div>

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

          <div className="mb-3">
            <CFormLabel htmlFor="site_id">
              Assign to Site {user?.role === 'admin' && <span className="text-muted">(Optional)</span>}
            </CFormLabel>
            {loadingSites ? (
              <div className="d-flex align-items-center">
                <CSpinner size="sm" className="me-2" />
                <span>Loading sites...</span>
              </div>
            ) : (
              <>
                <CFormSelect
                  id="site_id"
                  value={formData.site_id}
                  onChange={(e) => handleChange('site_id', e.target.value)}
                >
                  <option value="">-- No site assignment --</option>
                  {sites.map((site) => (
                    <option key={site.site_id} value={site.site_id}>
                      {site.site_number} - {site.site_name} ({site.institution_name})
                    </option>
                  ))}
                </CFormSelect>
                <small className="text-muted">
                  {user?.role === 'admin'
                    ? 'Select a site to assign the user to a specific site, or leave blank to create a company-level user.'
                    : 'Select the site where this user will work.'
                  }
                </small>
              </>
            )}
          </div>

          <CAlert color="info" className="d-flex align-items-center">
            <small>
              ℹ️ User will receive an Entra ID invitation email and must complete registration before they can log in.
            </small>
          </CAlert>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Provisioning User...' : 'Add User'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

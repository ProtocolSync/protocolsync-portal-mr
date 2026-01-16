import { 
  useNotify,
  useRefresh,
  useGetOne,
  useUpdate,
  useGetList
} from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Box
} from '@mui/material';

interface EditSiteAdministratorModalProps {
  administratorId: string | number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditSiteAdministratorModal = ({ 
  administratorId, 
  onClose, 
  onSuccess 
}: EditSiteAdministratorModalProps) => {
  const { user } = useAuth();
  const notify = useNotify();
  const refresh = useRefresh();
  const [update, { isLoading: isUpdating }] = useUpdate();

  // Fetch the administrator data
  const { data: administrator, isLoading: isLoadingAdmin } = useGetOne(
    'site-administrators',
    { id: administratorId }
  );

  // Fetch available sites
  const { data: sites, isLoading: isLoadingSites } = useGetList(
    'sites',
    {
      pagination: { page: 1, perPage: 100 },
      filter: {},
      meta: { companyId: user?.company?.id }
    },
    { enabled: !!user?.company?.id }
  );

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    job_title: '',
    department: '',
    professional_credentials: '',
    phone: '',
    status: 'active',
    site_id: ''
  });

  // Initialize form data when administrator loads
  useEffect(() => {
    if (administrator) {
      setFormData({
        full_name: administrator.full_name || '',
        email: administrator.email || '',
        job_title: administrator.job_title || '',
        department: administrator.department || '',
        professional_credentials: administrator.professional_credentials || '',
        phone: administrator.phone || '',
        status: administrator.status || 'active',
        site_id: administrator.site_id || ''
      });
    }
  }, [administrator]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    console.log('[EditModal] Submitting update:', {
      id: administratorId,
      formData,
      administrator,
      mergedData: {
        ...formData,
        user_id: administrator?.user_id,
        site_id: formData.site_id || administrator?.site_id
      }
    });
    
    try {
      await update(
        'site-administrators',
        {
          id: administratorId,
          data: {
            ...formData,
            user_id: administrator?.user_id,
            site_id: formData.site_id || administrator?.site_id
          },
          previousData: administrator
        },
        {
          onSuccess: () => {
            console.log('[EditModal] Update successful');
            notify('Site administrator updated successfully', { type: 'success' });
            refresh();
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            console.error('[EditModal] Update error:', error);
            notify(`Error: ${error.message}`, { type: 'error' });
          }
        }
      );
    } catch (error: any) {
      console.error('[EditModal] Update exception:', error);
      notify(`Error: ${error.message}`, { type: 'error' });
    }
  };

  const isLoading = isLoadingAdmin || isLoadingSites;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Site Administrator</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Email"
              value={formData.email}
              disabled
              fullWidth
            />
            
            <TextField
              label="Job Title"
              value={formData.job_title}
              onChange={(e) => handleChange('job_title', e.target.value)}
              fullWidth
            />
            
            <TextField
              label="Department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              fullWidth
            />
            
            <TextField
              label="Professional Credentials"
              value={formData.professional_credentials}
              onChange={(e) => handleChange('professional_credentials', e.target.value)}
              fullWidth
            />
            
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              fullWidth
            />
            
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
              <InputLabel>Assigned Site</InputLabel>
              <Select
                value={formData.site_id}
                onChange={(e) => handleChange('site_id', e.target.value)}
                label="Assigned Site"
              >
                {(sites || []).map((site: any) => (
                  <MenuItem key={site.site_id} value={site.site_id}>
                    {site.site_name} ({site.site_number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isUpdating || isLoading}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import { 
  useGetOne,
  useGetList
} from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { useState } from 'react';

interface SiteDetailModalProps {
  siteId: string | number;
  onClose: () => void;
}

export const SiteDetailModal = ({ siteId, onClose }: SiteDetailModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch site data
  const { data: site, isLoading: isSiteLoading } = useGetOne(
    'sites',
    { id: siteId, meta: { companyId: user?.company?.id } }
  );

  console.log('[SiteDetailModal] Site data:', site);
  console.log('[SiteDetailModal] Loading state:', isSiteLoading);

  // Fetch site administrators - filter client-side since backend returns all admins
  const { data: allAdmins, isLoading: isAdminsLoading } = useGetList(
    'site-administrators',
    {
      pagination: { page: 1, perPage: 100 },
      filter: {},
      meta: { companyId: user?.company?.id }
    },
    { enabled: !!user?.company?.id && activeTab === 1 }
  );

  // Filter admins to only show those for this specific site
  const admins = allAdmins?.filter((admin: any) => admin.site_id === Number(siteId)) || [];
  console.log('[SiteDetailModal] Filtered admins for site', siteId, ':', admins);

  const isLoading = isSiteLoading;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {site?.site_name || 'Site Details'}
          </Typography>
          {site?.status && (
            <Chip 
              label={site.status} 
              color={getStatusColor(site.status) as any}
              size="small"
            />
          )}
        </Box>
        {site?.site_number && (
          <Typography variant="subtitle2" color="text.secondary">
            {site.site_number}
          </Typography>
        )}
      </DialogTitle>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tab label="Overview" />
        <Tab label="Admins" />
      </Tabs>

      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 0 && site && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>Site Information</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Site Number</Typography>
                    <Typography variant="body2">{site.site_number || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Site Name</Typography>
                    <Typography variant="body2">{site.site_name || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Company</Typography>
                    <Typography variant="body2">{site.company_name || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Typography variant="body2">
                      <Chip
                        label={site.status || 'Unknown'}
                        color={getStatusColor(site.status) as any}
                        size="small"
                      />
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Active Users</Typography>
                    <Typography variant="body2">{site.active_user_count || 0}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Active Trials</Typography>
                    <Typography variant="body2">{site.active_trials_count || 0}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Site Administrator Count</Typography>
                    <Typography variant="body2">{site.site_admin_count || 0}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Site Users Count</Typography>
                    <Typography variant="body2">{site.site_user_count || 0}</Typography>
                  </Box>

                  {site.principal_investigator_name && (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="caption" color="text.secondary">Principal Investigator</Typography>
                      <Typography variant="body2">{site.principal_investigator_name}</Typography>
                    </Box>
                  )}

                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                    <Typography variant="body2">
                      {site.created_at ? new Date(site.created_at).toLocaleString() : 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">
                      Record Hash (21 CFR Part 11 Compliance)
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        color: 'text.secondary'
                      }}
                    >
                      {site.record_hash || 'Not available - run migration to generate'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Admins Tab */}
            {activeTab === 1 && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>Site Administrators</Typography>
                <Divider sx={{ mb: 2 }} />

                {isAdminsLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress size={24} />
                  </Box>
                ) : site?.users && site.users.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {site.users
                      .filter((user: any) => user.role === 'site_admin')
                      .map((admin: any) => (
                        <Box key={admin.user_id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography variant="subtitle1">{admin.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{admin.email}</Typography>
                          {admin.role && (
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                              Role: {admin.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Typography>
                          )}
                          <Box mt={1} mb={1}>
                            <Chip label={admin.status} size="small" color={getStatusColor(admin.status) as any} />
                          </Box>
                          {admin.record_hash && (
                            <Box mt={1}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Record Hash (21 CFR Part 11 Compliance)
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.7rem',
                                  wordBreak: 'break-all',
                                  color: 'text.secondary',
                                  mt: 0.5
                                }}
                              >
                                {admin.record_hash}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No administrators assigned to this site.</Typography>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

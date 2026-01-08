import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
  useRefresh,
  useNotify,
  useRecordContext,
  useDelete,
  useListContext,
  useUnselectAll
} from 'react-admin';
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useRole } from '../contexts/RoleContext';
import { CButton, CBadge, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUserPlus, cilTrash, cilEnvelopeClosed } from '@coreui/icons';
import { AddSiteUserModal } from './AddSiteUserModal';
import { UserDetailModal } from './UserDetailModal';
import { AssignUserToTrialModal } from './AssignUserToTrialModal';
import { IconButton, Tooltip, Box, Typography, useMediaQuery } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const RemoveSiteUserButton = ({ siteId }: { siteId: number }) => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const { user } = useUser();
  const [deleteOne] = useDelete();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!record) return null;
  
  // Prevent users from removing themselves from the site
  if (record.email === user?.email) return null;

  const handleRemove = () => {
    deleteOne(
      'site-users',
      { id: record.id, previousData: record, meta: { siteId } },
      {
        onSuccess: () => {
          notify('User removed from site successfully', { type: 'success' });
          refresh();
          setShowConfirmModal(false);
        },
        onError: (error: any) => {
          notify(`Error removing user: ${error.message}`, { type: 'error' });
          setShowConfirmModal(false);
        },
      }
    );
  };

  return (
    <>
      <CButton color="danger" variant="ghost" size="sm" onClick={() => setShowConfirmModal(true)}>
        <CIcon icon={cilTrash} />
      </CButton>

      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Remove User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to remove <strong>{record.name}</strong> from this site? This will not delete the user account.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleRemove}>
            Remove from Site
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

const ResendInvitationButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [isSending, setIsSending] = useState(false);

  if (!record) return null;

  // Only show for pending users
  if (record.status !== 'pending') return null;

  const handleResend = async () => {
    setIsSending(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const apiKey = import.meta.env.VITE_API_KEY;

      const headers: HeadersInit = {};

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Users routes are registered at /api, not /api/v1
      // API_BASE_URL is http://localhost:3000/api/v1, we need http://localhost:3000/api
      const apiUrl = API_BASE_URL.replace('/v1', '');

      const response = await fetch(
        `${apiUrl}/users/${record.user_id}/resend-invitation`,
        {
          method: 'POST',
          headers,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        notify('Invitation sent successfully', { type: 'success' });
        refresh();
      } else {
        notify(data.message || 'Failed to send invitation', { type: 'error' });
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      notify(`Error: ${error.message}`, { type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <CButton
      color="info"
      variant="ghost"
      size="sm"
      onClick={handleResend}
      disabled={isSending}
      title="Resend Entra invitation"
    >
      {isSending ? (
        <CSpinner size="sm" />
      ) : (
        <CIcon icon={cilEnvelopeClosed} />
      )}
    </CButton>
  );
};

const MobileSiteUserCard = ({ siteUser, siteId, onViewDetails, onAssignToTrial }: { 
  siteUser: any; 
  siteId: number;
  onViewDetails: () => void;
  onAssignToTrial: () => void;
}) => {
  const role = siteUser.role || 'site_user';
  const status = siteUser.status || 'inactive';
  const trials = siteUser.trial_assignments || [];
  
  const roleColorMap: Record<string, string> = {
    admin: 'danger',
    site_admin: 'warning',
    trial_lead: 'primary',
    site_user: 'info'
  };
  
  const statusColor = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'secondary';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{siteUser.name}</Typography>
          <Typography className="datagrid-card-subtitle">{siteUser.email}</Typography>
        </Box>
        <Box className="datagrid-card-actions">
          <Tooltip title="View Details">
            <IconButton size="small" onClick={onViewDetails} color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Assign to Trial">
            <IconButton size="small" onClick={onAssignToTrial} color="success">
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <ResendInvitationButton />
          <RemoveSiteUserButton siteId={siteId} />
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Job Title</Typography>
          <Typography className="datagrid-card-value">{siteUser.job_title || 'N/A'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Trial</Typography>
          <Typography className="datagrid-card-value">
            {trials.length === 0 ? (
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>No trials</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {trials.map((trial: any, index: number) => (
                  <div key={index} style={{ fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500 }}>{trial.trial_number}</span>
                    {trial.trial_role && (
                      <CBadge
                        color={trial.trial_role === 'Principal Investigator' ? 'primary' : 'info'}
                        size="sm"
                        style={{ marginLeft: '6px', fontSize: '0.75rem' }}
                      >
                        {trial.trial_role}
                      </CBadge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">User Role</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={roleColorMap[role] || 'secondary'}>
              {role.replace(/_/g, ' ').toUpperCase()}
            </CBadge>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={statusColor}>{status.toUpperCase()}</CBadge>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Assigned Date</Typography>
          <Typography className="datagrid-card-value">
            {siteUser.assigned_at ? new Date(siteUser.assigned_at).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const BulkRemoveSiteUsersButton = ({ siteId }: { siteId: number }) => {
  const { selectedIds, data } = useListContext();
  const [deleteOne] = useDelete();
  const unselectAll = useUnselectAll('site-users');
  const refresh = useRefresh();
  const notify = useNotify();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    setShowConfirmModal(false);
    
    try {
      for (const id of selectedIds) {
        const record = data?.find((item: any) => item.id === id);
        if (record) {
          await deleteOne(
            'site-users',
            { id, previousData: record, meta: { siteId } },
            {
              onError: (error: any) => {
                console.error('Remove error:', error);
                notify(`Error removing ${record.name || 'user'}: ${error.message}`, { type: 'error' });
              }
            }
          );
        }
      }
      
      notify(
        selectedIds.length === 1
          ? 'User removed from site successfully'
          : `${selectedIds.length} users removed from site successfully`,
        { type: 'success' }
      );
      
      unselectAll();
      refresh();
    } catch (error: any) {
      console.error('Bulk remove error:', error);
      notify(`Error during removal: ${error.message}`, { type: 'error' });
    } finally {
      setIsRemoving(false);
    }
  };

  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <>
      <CButton
        color="danger"
        onClick={() => setShowConfirmModal(true)}
        disabled={isRemoving}
      >
        <CIcon icon={cilTrash} className="me-2" />
        {isRemoving ? 'Removing...' : `Remove from Site (${selectedIds.length})`}
      </CButton>

      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Remove Users</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to remove {selectedIds.length === 1 ? 'this user' : `these ${selectedIds.length} users`} from this site? This will not delete the user accounts.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleRemove}>
            Remove from Site
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

const SiteUsersDatagrid = ({ 
  siteId, 
  onViewDetails,
  onAssignToTrial 
}: { 
  siteId: number;
  onViewDetails: (user: any) => void;
  onAssignToTrial: (user: any) => void;
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const { data } = useListContext();

  if (isMobile && data) {
    return (
      <Box className="datagrid-list-container">
        {data.map((siteUser: any) => (
          <MobileSiteUserCard
            key={siteUser.id}
            siteUser={siteUser}
            siteId={siteId}
            onViewDetails={() => onViewDetails(siteUser)}
            onAssignToTrial={() => onAssignToTrial(siteUser)}
          />
        ))}
      </Box>
    );
  }

  return (
    <Datagrid
      bulkActionButtons={<BulkRemoveSiteUsersButton siteId={siteId} />}
      sx={{
        '& .RaDatagrid-table': { borderCollapse: 'collapse' },
        '& .RaDatagrid-headerCell': { fontWeight: 600, backgroundColor: 'transparent', borderBottom: '2px solid #dee2e6', padding: '0.75rem' },
        '& .RaDatagrid-rowCell': { padding: '0.75rem', borderBottom: '1px solid #dee2e6' },
        '& .RaDatagrid-row:hover': { backgroundColor: '#f8f9fa' },
      }}
    >
      <FunctionField
        label="Name"
        render={(record: any) => (
          <div>
            <div style={{ fontWeight: 500 }}>
              <a href={`mailto:${record.email}`} style={{ color: '#321fdb', textDecoration: 'none' }}>
                {record.name}
              </a>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              {record.email}
            </div>
          </div>
        )}
      />
      <TextField source="job_title" label="Job Title" />
      <FunctionField
        label="Trial"
        render={(record: any) => {
          const trials = record.trial_assignments || [];

          if (trials.length === 0) {
            return <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>No trials</span>;
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {trials.map((trial: any, index: number) => (
                <div key={index} style={{ fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500 }}>{trial.trial_number}</span>
                  {trial.trial_role && (
                    <CBadge
                      color={trial.trial_role === 'Principal Investigator' ? 'primary' : 'info'}
                      size="sm"
                      style={{ marginLeft: '6px', fontSize: '0.75rem' }}
                    >
                      {trial.trial_role}
                    </CBadge>
                  )}
                </div>
              ))}
            </div>
          );
        }}
      />
      <FunctionField
        label="User Role"
        render={(record: any) => {
          const role = record.role || 'site_user';
          const colorMap: Record<string, string> = {
            admin: 'danger',
            site_admin: 'warning',
            trial_lead: 'primary',
            site_user: 'info'
          };
          return <CBadge color={colorMap[role] || 'secondary'}>{role.replace(/_/g, ' ').toUpperCase()}</CBadge>;
        }}
      />
      <FunctionField
        label="Status"
        render={(record: any) => {
          const status = record.status || 'inactive';
          const color = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'secondary';
          return <CBadge color={color}>{status.toUpperCase()}</CBadge>;
        }}
      />
      <DateField source="assigned_at" label="Assigned Date" showTime={false} />
      <FunctionField
        label="Actions"
        render={(record: any) => (
          <div className="d-flex gap-1 align-items-center">
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => onViewDetails(record)}
                color="primary"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Assign to Trial">
              <IconButton
                size="small"
                onClick={() => onAssignToTrial(record)}
                color="success"
              >
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <ResendInvitationButton />
            <RemoveSiteUserButton siteId={siteId} />
          </div>
        )}
      />
    </Datagrid>
  );
};

export const SiteUsers = () => {
  const { user } = useUser();
  const { activeRole } = useRole();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToAssign, setUserToAssign] = useState<any>(null);
  const [detectedSiteId, setDetectedSiteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useRefresh();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Determine siteId based on user role and context
  useEffect(() => {
    const fetchSiteForAdmin = async () => {
      setLoading(true);
      
      console.log('[SiteUsers] User object:', user);
      console.log('[SiteUsers] User site:', user?.site);
      console.log('[SiteUsers] User site.id:', user?.site?.id);
      console.log('[SiteUsers] Active role:', activeRole);
      
      // If user has a site (site_admin mode), use it
      // Check for both truthy and non-empty string
      if (user?.site?.id && user.site.id !== '') {
        console.log('[SiteUsers] Using site from user context:', user.site.id);
        const parsedSiteId = parseInt(user.site.id);
        if (!isNaN(parsedSiteId)) {
          setDetectedSiteId(parsedSiteId);
          setLoading(false);
          return;
        }
      }

      // If admin mode and user has company, fetch their sites
      if ((activeRole === 'admin' || activeRole === 'site_admin') && user?.company?.id) {
        try {
          console.log('[SiteUsers] Fetching sites for company:', user.company.id);
          const apiKey = import.meta.env.VITE_API_KEY;
          const headers: HeadersInit = {};
          if (apiKey) {
            headers['X-API-Key'] = apiKey;
          }
          const response = await fetch(`${API_BASE_URL}/companies/${user.company.id}/sites`, { headers });
          const data = await response.json();
          const sites = data.data || [];
          
          console.log('[SiteUsers] Found sites:', sites);
          
          if (sites.length === 1) {
            // If only one site, use it automatically
            console.log('[SiteUsers] Found single site:', sites[0].site_id);
            setDetectedSiteId(sites[0].site_id);
          } else if (sites.length > 1) {
            // Use first site as default (could enhance with a selector)
            console.log('[SiteUsers] Multiple sites found, using first:', sites[0].site_id);
            setDetectedSiteId(sites[0].site_id);
          } else {
            console.warn('[SiteUsers] No sites found for company');
          }
        } catch (error) {
          console.error('[SiteUsers] Error fetching sites:', error);
        }
      } else {
        console.warn('[SiteUsers] Cannot fetch sites - missing role or company ID');
      }
      
      setLoading(false);
    };

    fetchSiteForAdmin();
  }, [user, activeRole]);

  const siteId = detectedSiteId;

  console.log('[SiteUsers] User:', user);
  console.log('[SiteUsers] Active Role:', activeRole);
  console.log('[SiteUsers] Site ID:', siteId);

  if (loading) {
    return (
      <div className="p-3">
        <div className="alert alert-info">Loading site information...</div>
      </div>
    );
  }

  if (!siteId) {
    return (
      <div className="p-3">
        <div className="alert alert-warning">
          <strong>No site selected</strong>
          <div className="mt-2 small">
            <div>User role: {activeRole || user?.role || 'N/A'}</div>
            <div>Company: {user?.company?.name || 'N/A'}</div>
            <div>Please contact your administrator to assign a site.</div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure siteId is a number
  const numericSiteId = siteId;

  const handleSuccess = () => {
    refresh();
  };

  return (
    <div className="datagrid-container">
      <div className="datagrid-header">
        <div>
          <h4>Site Users</h4>
          <div className="text-muted small">View and manage users assigned to this trial site</div>
        </div>
        <CButton color="primary" onClick={() => setShowAddModal(true)}>
          <CIcon icon={cilUserPlus} className="me-2" />
          Add Site User
        </CButton>
      </div>

      <div className="bg-white rounded shadow-sm">
      <List 
        resource="site-users"
        title="Site Users"
        perPage={25}
        queryOptions={{ meta: { siteId } }}
      >
      <SiteUsersDatagrid 
        siteId={numericSiteId}
        onViewDetails={setSelectedUser}
        onAssignToTrial={setUserToAssign}
      />
    </List>
    </div>
    <AddSiteUserModal
      visible={showAddModal}
      siteId={numericSiteId}
      onClose={() => setShowAddModal(false)}
      onSuccess={handleSuccess}
    />
    {selectedUser && (
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    )}
    {userToAssign && (
      <AssignUserToTrialModal
        visible={true}
        user={userToAssign}
        siteId={numericSiteId}
        onClose={() => setUserToAssign(null)}
        onSuccess={handleSuccess}
      />
    )}
    </div>
  );
};

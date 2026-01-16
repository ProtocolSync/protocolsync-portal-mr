import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  FunctionField,
  useRefresh,
  useNotify,
  useRecordContext,
  useUpdate,
  useListContext,
  useUnselectAll
} from 'react-admin';
import { CButton, CBadge, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilCheckCircle, cilXCircle, cilEnvelopeClosed } from '@coreui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { AddUserModal } from './AddUserModal';
import { UserDetailModal } from './UserDetailModal';
import { IconButton, Tooltip, Box, Typography, useMediaQuery } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { usersService } from '../apiClient';

const getRoleLabel = (accountType: string) => {
  const roleMap: Record<string, string> = {
    'site_admin': 'Site Administrator',
    'trial_lead': 'Trial Lead',
    'site_user': 'Site User',
    'admin': 'Administrator'
  };
  return roleMap[accountType] || accountType;
};

const MobileUserCard = ({ user, onViewDetails }: { user: any; onViewDetails: () => void }) => {
  const status = user.status || 'inactive';
  const displayRole = user.role || 'site_user';
  
  const roleColorMap: Record<string, string> = {
    admin: 'danger',
    site_admin: 'warning',
    site_user: 'info'
  };

  const statusColor = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'secondary';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{user.name}</Typography>
          <Typography className="datagrid-card-subtitle">{user.email}</Typography>
        </Box>
        <Box className="datagrid-card-actions">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={onViewDetails}
              color="primary"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <ResendInvitationButton />
          <ToggleUserStatusButton />
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Job Title</Typography>
          <Typography className="datagrid-card-value">{user.job_title || 'N/A'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Role</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={roleColorMap[displayRole] || 'secondary'}>
              {getRoleLabel(displayRole)}
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
          <Typography className="datagrid-card-label">Last Login</Typography>
          <Typography className="datagrid-card-value">
            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const ToggleUserStatusButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const { user } = useAuth();
  const [update] = useUpdate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!record) return null;

  // Prevent users from deactivating themselves
  if (record.email === user?.email) return null;

  const status = record.status || 'inactive';
  const isActive = status === 'active' || status === 'pending';

  const handleToggleStatus = () => {
    const newStatus = isActive ? 'inactive' : 'active';

    update(
      'users',
      {
        id: record.id,
        data: { status: newStatus },
        meta: { companyId: user?.company?.id }
      },
      {
        onSuccess: () => {
          notify(
            isActive
              ? 'User deactivated successfully'
              : 'User activated successfully',
            { type: 'success' }
          );
          refresh();
          setShowConfirmModal(false);
        },
        onError: (error: any) => {
          notify(
            `Error ${isActive ? 'deactivating' : 'activating'} user: ${error.message}`,
            { type: 'error' }
          );
          setShowConfirmModal(false);
        },
      }
    );
  };

  return (
    <>
      {isActive ? (
        <CButton color="warning" variant="ghost" size="sm" onClick={() => setShowConfirmModal(true)}>
          <CIcon icon={cilXCircle} />
        </CButton>
      ) : (
        <CButton color="success" variant="ghost" size="sm" onClick={() => setShowConfirmModal(true)}>
          <CIcon icon={cilCheckCircle} />
        </CButton>
      )}

      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>
            {isActive ? 'Confirm Deactivation' : 'Confirm Activation'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {isActive ? (
            <>
              Are you sure you want to deactivate <strong>{record.name}</strong>?
              They will no longer be able to access the system.
            </>
          ) : (
            <>
              Are you sure you want to activate <strong>{record.name}</strong>?
              They will regain access to the system.
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton color={isActive ? 'warning' : 'success'} onClick={handleToggleStatus}>
            {isActive ? 'Deactivate User' : 'Activate User'}
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
      const response = await usersService.resendInvitation(record.id);

      if (response.success) {
        notify('Invitation sent successfully', { type: 'success' });
        refresh();
      } else {
        notify(response.error || 'Failed to send invitation', { type: 'error' });
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

const BulkToggleStatusButton = () => {
  const { selectedIds, data } = useListContext();
  const [update] = useUpdate();
  const unselectAll = useUnselectAll('users');
  const refresh = useRefresh();
  const notify = useNotify();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [action, setAction] = useState<'activate' | 'deactivate'>('deactivate');

  const handleBulkToggle = async (newStatus: 'active' | 'inactive') => {
    setIsProcessing(true);
    setShowConfirmModal(false);

    try {
      for (const id of selectedIds) {
        const record = data?.find((item: any) => item.id === id);
        if (record) {
          await update(
            'users',
            {
              id,
              data: { status: newStatus },
              previousData: record,
              meta: { companyId: user?.company?.id }
            },
            {
              onError: (error: any) => {
                console.error('Update error:', error);
                notify(`Error updating ${record.name || 'user'}: ${error.message}`, { type: 'error' });
              }
            }
          );
        }
      }

      notify(
        selectedIds.length === 1
          ? `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
          : `${selectedIds.length} users ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
        { type: 'success' }
      );

      unselectAll();
      refresh();
    } catch (error: any) {
      console.error('Bulk update error:', error);
      notify(`Error during update: ${error.message}`, { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <>
      <CButton
        color="warning"
        onClick={() => {
          setAction('deactivate');
          setShowConfirmModal(true);
        }}
        disabled={isProcessing}
        className="me-2"
      >
        <CIcon icon={cilXCircle} className="me-2" />
        {isProcessing ? 'Processing...' : `Deactivate (${selectedIds.length})`}
      </CButton>

      <CButton
        color="success"
        onClick={() => {
          setAction('activate');
          setShowConfirmModal(true);
        }}
        disabled={isProcessing}
      >
        <CIcon icon={cilCheckCircle} className="me-2" />
        {isProcessing ? 'Processing...' : `Activate (${selectedIds.length})`}
      </CButton>

      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>
            {action === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to {action} {selectedIds.length === 1 ? 'this user' : `these ${selectedIds.length} users`}?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton
            color={action === 'deactivate' ? 'warning' : 'success'}
            onClick={() => handleBulkToggle(action === 'activate' ? 'active' : 'inactive')}
          >
            {action === 'deactivate' ? 'Deactivate' : 'Activate'} {selectedIds.length === 1 ? 'User' : 'Users'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

const UsersDatagrid = ({ onViewDetails }: { onViewDetails: (user: any) => void }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const { data } = useListContext();

  if (isMobile && data) {
    return (
      <Box className="datagrid-list-container">
        {data.map((user: any) => (
          <MobileUserCard
            key={user.id}
            user={user}
            onViewDetails={() => onViewDetails(user)}
          />
        ))}
      </Box>
    );
  }

  return (
    <Datagrid
      bulkActionButtons={<BulkToggleStatusButton />}
      sx={{
        '& .RaDatagrid-table': { borderCollapse: 'collapse' },
        '& .RaDatagrid-headerCell': { fontWeight: 600, backgroundColor: 'transparent', borderBottom: '2px solid #dee2e6', padding: '0.75rem' },
        '& .RaDatagrid-rowCell': { padding: '0.75rem', borderBottom: '1px solid #dee2e6' },
        '& .RaDatagrid-row:hover': { backgroundColor: '#f8f9fa' },
      }}
    >
      <TextField source="name" label="Name" />
      <EmailField source="email" label="Email" />
      <TextField source="job_title" label="Job Title" />
      <FunctionField
        label="Role"
        render={(record: any) => {
          const displayRole = record.role || 'site_user';
          const colorMap: Record<string, string> = {
            admin: 'danger',
            site_admin: 'warning',
            site_user: 'info'
          };
          return <CBadge color={colorMap[displayRole] || 'secondary'}>{getRoleLabel(displayRole)}</CBadge>;
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
      <DateField source="last_login_at" label="Last Login" showTime={false} />
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
            <ResendInvitationButton />
            <ToggleUserStatusButton />
          </div>
        )}
      />
    </Datagrid>
  );
};

export const Users = () => {
  const { user } = useAuth();
  const refresh = useRefresh();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  if (!user?.company?.id) {
    return <div>Loading...</div>;
  }

  const handleSuccess = () => {
    refresh();
  };

  return (
    <div className="datagrid-container">
      <div className="datagrid-header">
        <div>
          <h4>Users</h4>
          <div className="text-muted small">Manage company users and their permissions</div>
        </div>
        <CButton color="primary" onClick={() => setShowAddModal(true)}>
          <CIcon icon={cilPlus} className="me-2" />
          Add User
        </CButton>
      </div>

      <div className="bg-white rounded shadow-sm">
      <List
        resource="users"
        title="Users"
        perPage={25}
        queryOptions={{ meta: { companyId: user.company.id } }}
      >
        <UsersDatagrid onViewDetails={setSelectedUser} />
      </List>
      </div>
      <AddUserModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

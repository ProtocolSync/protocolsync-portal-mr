import {
  List,
  Datagrid,
  TextField,
  EmailField,
  FunctionField,
  useRefresh,
  Button,
  useListContext,
  useDelete,
  useUnselectAll,
  useNotify
} from 'react-admin';
import { CButton, CBadge, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilX } from '@coreui/icons';
import { useUser } from '../contexts/UserContext';
import { useState } from 'react';
import { AddSiteAdministratorModal } from './AddSiteAdministratorModal';
import { AdministratorDetailModal } from './AdministratorDetailModal';
import { Box, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';

const Empty = ({ onAddClick }: { onAddClick: () => void }) => (
  <Box textAlign="center" m={4}>
    <PersonAddIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
    <Typography variant="h5" paragraph color="text.secondary">
      No Site Administrators Yet
    </Typography>
    <Typography variant="body1" paragraph color="text.secondary">
      Add your first site administrator to manage trial sites.
    </Typography>
    <Button
      onClick={onAddClick}
      label="Add Site Administrator"
      variant="contained"
    >
      <PersonAddIcon sx={{ mr: 1 }} />
    </Button>
  </Box>
);

const MobileSiteAdministratorCard = ({ admin, onViewDetails }: { admin: any; onViewDetails: () => void }) => {
  const statusColor = admin.status === 'active' ? 'success' : admin.status === 'inactive' ? 'secondary' : 'warning';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{admin.name}</Typography>
          <Typography className="datagrid-card-subtitle">{admin.email}</Typography>
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
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Job Title</Typography>
          <Typography className="datagrid-card-value">{admin.job_title || 'N/A'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Site</Typography>
          <Typography className="datagrid-card-value">
            {admin.site_name} ({admin.site_number})
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={statusColor}>{admin.status?.toUpperCase()}</CBadge>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const BulkRemoveButton = () => {
  const { selectedIds, data } = useListContext();
  const [deleteOne] = useDelete();
  const unselectAll = useUnselectAll('site-administrators');
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
            'site-administrators',
            { id, previousData: record },
            {
              onError: (error: any) => {
                console.error('Remove error:', error);
                notify(`Error removing ${record.name || 'administrator'}: ${error.message}`, { type: 'error' });
              }
            }
          );
        }
      }

      notify(
        selectedIds.length === 1
          ? 'Site administrator removed from site successfully'
          : `${selectedIds.length} site administrators removed from site successfully`,
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
        color="warning"
        onClick={() => setShowConfirmModal(true)}
        disabled={isRemoving}
      >
        <CIcon icon={cilX} className="me-2" />
        {isRemoving ? 'Removing...' : `Remove from Site (${selectedIds.length})`}
      </CButton>

      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Removal from Site</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Are you sure you want to remove {selectedIds.length === 1 ? 'this site administrator' : `these ${selectedIds.length} site administrators`} from this site?
          </p>
          <p className="text-muted small mb-0">
            <strong>Note:</strong> This will remove their site assignment. The user account will remain in the system for audit compliance (21 CFR Part 11).
            This action will be logged in the audit trail.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton color="warning" onClick={handleRemove}>
            Remove from Site
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

const SiteAdministratorsDatagrid = ({ onViewDetails }: { onViewDetails: (admin: any) => void }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const { data } = useListContext();

  if (isMobile && data) {
    return (
      <Box className="datagrid-list-container">
        {data.map((admin: any) => (
          <MobileSiteAdministratorCard
            key={admin.id}
            admin={admin}
            onViewDetails={() => onViewDetails(admin)}
          />
        ))}
      </Box>
    );
  }

  return (
    <Datagrid
      bulkActionButtons={<BulkRemoveButton />}
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
        label="Site"
        render={(record: any) => `${record.site_name} (${record.site_number})`}
      />
      <FunctionField
        label="Status"
        render={(record: any) => (
          <CBadge color={record.status === 'active' ? 'success' : record.status === 'inactive' ? 'secondary' : 'warning'}>
            {record.status?.toUpperCase()}
          </CBadge>
        )}
      />
      <FunctionField
        label="Actions"
        render={(record: any) => (
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => onViewDetails(record)}
              color="primary"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      />
    </Datagrid>
  );
};

export const SiteAdministrators = () => {
  const { user } = useUser();
  const refresh = useRefresh();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

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
          <h4>Site Administrators</h4>
          <div className="text-muted small">Manage site administrators and their access permissions</div>
        </div>
        <CButton color="primary" onClick={() => setShowAddModal(true)}>
          <CIcon icon={cilPlus} className="me-2" />
          Add Site Administrator
        </CButton>
      </div>

      <div className="bg-white rounded shadow-sm">
      <List
        resource="site-administrators"
        title="Site Administrators"
        perPage={25}
        queryOptions={{ meta: { companyId: user.company.id } }}
        empty={<Empty onAddClick={() => setShowAddModal(true)} />}
      >
        <SiteAdministratorsDatagrid onViewDetails={setSelectedAdmin} />
      </List>
      </div>
      <AddSiteAdministratorModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
      {selectedAdmin && (
        <AdministratorDetailModal
          administrator={selectedAdmin}
          onClose={() => setSelectedAdmin(null)}
        />
      )}
    </div>
  );
};

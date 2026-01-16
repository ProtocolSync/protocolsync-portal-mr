import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  useRefresh,
  useRecordContext,
  useListContext
} from 'react-admin';
import { CButton, CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilLockLocked, cilLockUnlocked } from '@coreui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { AddTrialModal } from './AddTrialModal';
import { TrialDetailModal } from './TrialDetailModal';
import { TrialStatusModal } from './TrialStatusModal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { designTokens } from '@protocolsync/shared-styles/design-tokens';

const ToggleTrialStatusButton = () => {
  const record = useRecordContext();
  const { user } = useAuth();
  const [showStatusModal, setShowStatusModal] = useState(false);

  if (!record) return null;

  // Only site admins can change trial status
  if (user?.role !== 'site_admin' && user?.role !== 'admin') return null;

  const isActive = record.status === 'active';

  return (
    <>
      <CButton
        color={isActive ? 'warning' : 'success'}
        variant="ghost"
        size="sm"
        onClick={() => setShowStatusModal(true)}
        title={isActive ? 'Pause trial' : 'Activate trial'}
      >
        <CIcon icon={isActive ? cilLockLocked : cilLockUnlocked} style={{ fontSize: '16px' }} />
      </CButton>
      {showStatusModal && (
        <TrialStatusModal
          visible={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          trial={{
            trial_id: record.trial_id,
            trial_number: record.trial_number,
            trial_name: record.trial_name,
            status: record.status
          }}
        />
      )}
    </>
  );
};

const ShowTrialButton = () => {
  const record = useRecordContext();
  const [showDetailModal, setShowDetailModal] = useState(false);

  if (!record) return null;

  return (
    <>
      <CButton
        color="info"
        variant="ghost"
        size="sm"
        onClick={() => setShowDetailModal(true)}
      >
        <VisibilityIcon style={{ fontSize: '16px' }} />
      </CButton>
      {showDetailModal && (
        <TrialDetailModal
          trialId={record.trial_id}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'closed':
      return 'secondary';
    case 'completed':
      return 'info';
    default:
      return 'secondary';
  }
};

const getPhaseColor = (phase?: string) => {
  if (!phase) return 'secondary';
  switch (phase.toLowerCase()) {
    case 'phase i':
      return 'info';
    case 'phase ii':
      return 'primary';
    case 'phase iii':
      return 'warning';
    case 'phase iv':
      return 'success';
    default:
      return 'secondary';
  }
};

const MobileTrialCard = ({ trial }: { trial: any }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { user } = useAuth();

  // Only site admins can change trial status
  const canChangeStatus = user?.role === 'site_admin' || user?.role === 'admin';
  const isActive = trial.status === 'active';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{trial.trial_name}</Typography>
          <Typography className="datagrid-card-subtitle">{trial.trial_number}</Typography>
        </Box>
        <Box className="datagrid-card-actions">
          {canChangeStatus && (
            <CButton
              color={isActive ? 'warning' : 'success'}
              variant="ghost"
              size="sm"
              onClick={() => setShowStatusModal(true)}
              title={isActive ? 'Pause trial' : 'Activate trial'}
            >
              <CIcon icon={isActive ? cilLockLocked : cilLockUnlocked} style={{ fontSize: '16px' }} />
            </CButton>
          )}
          <CButton
            color="info"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetailModal(true)}
          >
            <VisibilityIcon style={{ fontSize: '16px' }} />
          </CButton>
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Protocol</Typography>
          <Typography className="datagrid-card-value">{trial.protocol_number || 'N/A'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Phase</Typography>
          <Typography className="datagrid-card-value">
            {trial.phase ? (
              <CBadge color={getPhaseColor(trial.phase)}>{trial.phase}</CBadge>
            ) : (
              <span style={{ color: '#9ca3af' }}>-</span>
            )}
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={getStatusColor(trial.status)}>{trial.status}</CBadge>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Principal Investigator</Typography>
          <Typography className="datagrid-card-value">{trial.pi_name || 'Not assigned'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Team</Typography>
          <Typography className="datagrid-card-value">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}>
              {trial.assigned_user_count || 0} {trial.assigned_user_count === 1 ? 'member' : 'members'}
            </span>
          </Typography>
        </Box>
      </Box>

      {/* Modals */}
      {showStatusModal && (
        <TrialStatusModal
          visible={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          trial={{
            trial_id: trial.trial_id,
            trial_number: trial.trial_number,
            trial_name: trial.trial_name,
            status: trial.status
          }}
        />
      )}
      {showDetailModal && (
        <TrialDetailModal
          trialId={trial.trial_id}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </Box>
  );
};

const EmptyTrialsList = ({ onCreateClick }: { onCreateClick: () => void }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: designTokens.color.background.focus,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Box
          sx={{
            fontSize: '48px',
            color: designTokens.color.text.subtle,
          }}
        >
          🔬
        </Box>
      </Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: designTokens.color.text.default }}>
        No Trials yet.
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: designTokens.color.text.subtle, maxWidth: 400 }}>
        Get started by creating your first clinical trial. Trials represent specific research studies conducted at your site.
      </Typography>
      <CButton
        color="primary"
        size="lg"
        onClick={onCreateClick}
        style={{
          backgroundColor: designTokens.color.brand.accentGreen500,
          borderColor: designTokens.color.brand.accentGreen500,
        }}
      >
        <CIcon icon={cilPlus} className="me-2" />
        Create Your First Trial
      </CButton>
    </Box>
  );
};

const TrialsDatagrid = ({ onCreateClick }: { onCreateClick: () => void }) => {
  const { data, isLoading } = useListContext();
  const isMobile = useMediaQuery('(max-width:768px)');

  if (isLoading) return null;

  if (!data || data.length === 0) {
    return <EmptyTrialsList onCreateClick={onCreateClick} />;
  }

  if (isMobile) {
    return (
      <Box className="datagrid-list-container">
        {data.map((trial: any) => (
          <MobileTrialCard key={trial.trial_id} trial={trial} />
        ))}
      </Box>
    );
  }

  return (
    <>
      <Datagrid
        bulkActionButtons={false}
        isRowSelectable={() => false}
        sx={{
          '& .RaDatagrid-table': {
            borderCollapse: 'collapse',
          },
          '& .RaDatagrid-headerCell': {
            fontWeight: 600,
            backgroundColor: 'transparent',
            borderBottom: '2px solid #dee2e6',
            padding: '0.75rem',
          },
          '& .RaDatagrid-rowCell': {
            padding: '0.75rem',
            borderBottom: '1px solid #dee2e6',
          },
          '& .RaDatagrid-row:hover': {
            backgroundColor: '#f8f9fa',
          },
        }}
      >
        <TextField source="trial_number" label="Trial Number" />
        <TextField source="trial_name" label="Trial Name" />
        <TextField source="protocol_number" label="Protocol" />
        <FunctionField
          label="Phase"
          render={(record: any) =>
            record.phase ? (
              <CBadge color={getPhaseColor(record.phase)}>
                {record.phase}
              </CBadge>
            ) : (
              <span style={{ color: '#9ca3af' }}>-</span>
            )
          }
        />
        <FunctionField
          label="Status"
          render={(record: any) => (
            <CBadge color={getStatusColor(record.status)}>
              {record.status}
            </CBadge>
          )}
        />
        <TextField source="pi_name" label="Principal Investigator" emptyText="Not assigned" />
        <FunctionField
          label="Team"
          render={(record: any) => (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}>
              {record.assigned_user_count || 0} {record.assigned_user_count === 1 ? 'member' : 'members'}
            </span>
          )}
        />
        <FunctionField
          label="Actions"
          render={() => (
            <div style={{ display: 'flex', gap: '4px' }}>
              <ToggleTrialStatusButton />
              <ShowTrialButton />
            </div>
          )}
        />
      </Datagrid>
    </>
  );
};

export const Trials = () => {
  const { user } = useAuth();
  const refresh = useRefresh();
  const [showAddModal, setShowAddModal] = useState(false);

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  const handleSuccess = () => {
    refresh();
  };

  return (
    <div className="datagrid-container">
      <div className="datagrid-header">
        <div>
          <h4>Clinical Trials</h4>
          <div className="text-muted small">Manage clinical trials at your site</div>
        </div>
        <CButton color="primary" onClick={() => setShowAddModal(true)}>
          <CIcon icon={cilPlus} className="me-2" />
          Create Trial
        </CButton>
      </div>

      <div className="bg-white rounded shadow-sm">
        <List
          resource="trials"
          title="Trials"
          perPage={25}
          queryOptions={{ meta: { userId: user.id } }}
          empty={<EmptyTrialsList onCreateClick={() => setShowAddModal(true)} />}
        >
          <TrialsDatagrid onCreateClick={() => setShowAddModal(true)} />
        </List>
      </div>
      <AddTrialModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

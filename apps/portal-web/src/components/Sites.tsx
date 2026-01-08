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
import { useUser } from '../contexts/UserContext';
import { useState } from 'react';
import { AddSiteModal } from './AddSiteModal';
import { SiteDetailModal } from './SiteDetailModal';
import { SiteStatusModal } from './SiteStatusModal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { designTokens } from '../design-tokens';

const ToggleSiteStatusButton = () => {
  const record = useRecordContext();
  const { user } = useUser();
  const [showStatusModal, setShowStatusModal] = useState(false);

  if (!record) return null;

  // Only admins can enable/disable sites
  if (user?.role !== 'admin') return null;

  const isActive = record.status === 'active';

  return (
    <>
      <CButton
        color={isActive ? 'warning' : 'success'}
        variant="ghost"
        size="sm"
        onClick={() => setShowStatusModal(true)}
        title={isActive ? 'Disable site' : 'Enable site'}
      >
        <CIcon icon={isActive ? cilLockLocked : cilLockUnlocked} style={{ fontSize: '16px' }} />
      </CButton>
      {showStatusModal && (
        <SiteStatusModal
          visible={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          site={{
            site_id: record.site_id,
            site_number: record.site_number,
            site_name: record.site_name,
            status: record.status
          }}
        />
      )}
    </>
  );
};

const ShowSiteButton = () => {
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
        <SiteDetailModal
          siteId={record.site_id}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};


const EmptySitesList = ({ onCreateClick }: { onCreateClick: () => void }) => {
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
          🏢
        </Box>
      </Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: designTokens.color.text.default }}>
        No Sites yet.
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: designTokens.color.text.subtle, maxWidth: 400 }}>
        Get started by creating your first trial site. Sites represent the physical locations where your clinical trials are conducted.
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
        Create Your First Site
      </CButton>
    </Box>
  );
};

const MobileSiteCard = ({ record }: { record: any }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { user } = useUser();

  if (!record) return null;

  const isActive = record.status === 'active';
  const location = [record.city, record.state_province, record.country]
    .filter(Boolean)
    .join(', ') || '-';

  return (
    <>
      <div className="datagrid-card">
        <div className="datagrid-card-header">
          <div>
            <h3 className="datagrid-card-title">{record.site_name}</h3>
            <p className="datagrid-card-subtitle">{record.site_number}</p>
          </div>
          <div className="datagrid-card-actions">
            {user?.role === 'admin' && (
              <CButton
                color={isActive ? 'warning' : 'success'}
                variant="ghost"
                size="sm"
                onClick={() => setShowStatusModal(true)}
                title={isActive ? 'Disable site' : 'Enable site'}
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
          </div>
        </div>

        <div className="datagrid-card-details">
          <div className="datagrid-card-detail-row">
            <span className="datagrid-card-label">Institution</span>
            <span className="datagrid-card-value">{record.institution_name}</span>
          </div>
          <div className="datagrid-card-detail-row">
            <span className="datagrid-card-label">Location</span>
            <span className="datagrid-card-value">{location}</span>
          </div>
          <div className="datagrid-card-detail-row">
            <span className="datagrid-card-label">Status</span>
            <div>
              <CBadge color={record.status === 'active' ? 'success' : record.status === 'inactive' ? 'secondary' : 'warning'}>
                {record.status.toUpperCase()}
              </CBadge>
            </div>
          </div>
        </div>
      </div>

      {showDetailModal && (
        <SiteDetailModal
          siteId={record.site_id}
          onClose={() => setShowDetailModal(false)}
        />
      )}
      {showStatusModal && (
        <SiteStatusModal
          visible={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          site={{
            site_id: record.site_id,
            site_number: record.site_number,
            site_name: record.site_name,
            status: record.status
          }}
        />
      )}
    </>
  );
};

const SitesDatagrid = ({ onCreateClick }: { onCreateClick: () => void }) => {
  const { data, isLoading } = useListContext();
  const isSmall = useMediaQuery((theme: any) => theme.breakpoints.down('md'));

  if (isLoading) return null;

  if (!data || data.length === 0) {
    return <EmptySitesList onCreateClick={onCreateClick} />;
  }

  // Mobile view: show cards
  if (isSmall) {
    return (
      <div>
        {data.map((record: any) => (
          <MobileSiteCard key={record.id || record.site_id} record={record} />
        ))}
      </div>
    );
  }

  // Desktop view: show table
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
        <TextField source="site_name" label="Site Name" />
        <TextField source="site_number" label="Site Number" />
        <TextField source="institution_name" label="Institution" />
        <FunctionField 
          label="Location" 
          render={(record: any) => {
            const parts = [];
            if (record.city) parts.push(record.city);
            if (record.state_province) parts.push(record.state_province);
            if (record.country) parts.push(record.country);
            return parts.join(', ') || '-';
          }} 
        />
        <FunctionField
          label="Status"
          render={(record: any) => (
            <CBadge color={record.status === 'active' ? 'success' : record.status === 'inactive' ? 'secondary' : 'warning'}>
              {record.status.toUpperCase()}
            </CBadge>
          )}
        />
        <FunctionField
          label="Actions"
          render={() => (
            <div style={{ display: 'flex', gap: '4px' }}>
              <ToggleSiteStatusButton />
              <ShowSiteButton />
            </div>
          )}
        />
      </Datagrid>
    </>
  );
};

export const Sites = () => {
  const { user } = useUser();
  const refresh = useRefresh();
  const [showAddModal, setShowAddModal] = useState(false);

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
          <h4>Trial Sites</h4>
          <div className="text-muted small">Manage clinical trial sites and locations</div>
        </div>
        <CButton color="primary" onClick={() => setShowAddModal(true)}>
          <CIcon icon={cilPlus} className="me-2" />
          Create Site
        </CButton>
      </div>

      <div className="datagrid-list-container">
        <List 
          resource="sites"
          title="Sites"
          perPage={25}
          queryOptions={{ meta: { companyId: user.company.id } }}
          empty={<EmptySitesList onCreateClick={() => setShowAddModal(true)} />}
        >
          <SitesDatagrid onCreateClick={() => setShowAddModal(true)} />
        </List>
      </div>
      <AddSiteModal 
        visible={showAddModal}
        onClose={() => setShowAddModal(false)} 
        onSuccess={handleSuccess}
      />
    </div>
  );
};

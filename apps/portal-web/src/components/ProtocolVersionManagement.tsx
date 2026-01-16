import { useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  useGetList,
  Title,
  useRefresh
} from 'react-admin';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { CButton, CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCloudUpload } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import { ProtocolUploadModal } from './ProtocolUploadModal';
import { VersionBadge } from './VersionBadge';
import { useAuth } from '../contexts/AuthContext';

const MobileProtocolVersionCard = ({ 
  document,
  onView
}: { 
  document: any;
  onView: (id: string) => void;
}) => {
  const statusColor = document.status === 'Current' ? 'success' : 'warning';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{document.documentName}</Typography>
          <Typography className="datagrid-card-subtitle">
            <VersionBadge version={document.currentVersion} />
          </Typography>
        </Box>
        <Box className="datagrid-card-actions">
          <CButton
            color="info"
            variant="ghost"
            size="sm"
            onClick={() => onView(document.id)}
          >
            View
          </CButton>
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Total Versions</Typography>
          <Typography className="datagrid-card-value">
            {document.totalVersions > 0 ? (
              <CBadge color="secondary">{document.totalVersions}</CBadge>
            ) : <span>—</span>}
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={statusColor}>{document.status}</CBadge>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const ProtocolVersionsDatagrid = ({
  documents,
  isLoading,
  onView
}: {
  documents: any[];
  isLoading: boolean;
  onView: (id: string) => void;
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');

  if (isMobile) {
    return (
      <Box className="datagrid-list-container">
        {documents.map((document: any) => (
          <MobileProtocolVersionCard
            key={document.id}
            document={document}
            onView={onView}
          />
        ))}
      </Box>
    );
  }

  return (
    <Datagrid 
      data={documents}
      isLoading={isLoading}
      bulkActionButtons={false}
      sx={{
        '& .RaDatagrid-table': { borderCollapse: 'collapse' },
        '& .RaDatagrid-headerCell': { fontWeight: 600, backgroundColor: 'transparent', borderBottom: '2px solid #dee2e6', padding: '0.75rem' },
        '& .RaDatagrid-rowCell': { padding: '0.75rem', borderBottom: '1px solid #dee2e6' },
        '& .RaDatagrid-row:hover': { backgroundColor: '#f8f9fa' },
      }}
    >
      <TextField source="documentName" label="Document Name" />
      <FunctionField 
        label="Current Version" 
        render={(record: any) => <VersionBadge version={record.currentVersion} />}
      />
      <FunctionField 
        label="Total Versions" 
        render={(record: any) => 
          record.totalVersions > 0 ? (
            <CBadge color="secondary">{record.totalVersions}</CBadge>
          ) : <span>—</span>
        } 
      />
      <FunctionField
        label="Status"
        render={(record: any) => (
          <CBadge color={record.status === 'Current' ? 'success' : 'warning'}>
            {record.status}
          </CBadge>
        )}
      />
      <FunctionField
        label="Actions"
        render={(record: any) => (
          <CButton
            color="info"
            variant="ghost"
            size="sm"
            onClick={() => onView(record.id)}
          >
            View
          </CButton>
        )}
      />
    </Datagrid>
  );
};

export const ProtocolVersionManagement = () => {
  const navigate = useNavigate();
  const refresh = useRefresh();
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { data, isLoading } = useGetList('protocol-documents', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'documentName', order: 'ASC' },
  });

  // Debug: Log user context to understand site_id availability
  console.log('[ProtocolVersionManagement] User context:', {
    userId: user?.id,
    siteId: user?.site?.id,
    companyId: user?.company?.id,
    role: user?.role,
    fullUser: user
  });

  // Group documents by document_type to show only latest version per protocol
  const documents = data ? Object.values(
    data.reduce((acc: any, doc: any) => {
      const docType = doc.document_type || doc.original_filename || 'Untitled';
      
      if (!acc[docType] || 
          new Date(doc.upload_date || doc.created_at) > new Date(acc[docType].upload_date || acc[docType].created_at)) {
        acc[docType] = doc;
      }
      return acc;
    }, {})
  ).map((doc: any) => {
    const docType = doc.document_type || doc.original_filename || 'Untitled';
    const versionCount = data.filter((d: any) => 
      (d.document_type || d.original_filename || 'Untitled') === docType
    ).length;
    
    return {
      ...doc,
      id: doc.document_id || doc.id,
      documentName: docType,
      currentVersion: doc.document_version || 'N/A',
      totalVersions: versionCount,
      status: doc.status || 'uploaded',
    };
  }) : [];

  const handleUploadSuccess = () => {
    refresh();
  };

  const handleView = (id: string) => {
    navigate(`/protocols/${id}`);
  };

  // Get site_id - could be from user.site or we might need to handle differently
  const siteId = user?.site?.id || '';
  const canUpload = !!siteId; // Can only upload if we have a valid site_id

  return (
    <div className="p-3">
      <Title title="Protocol Versions" />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4>Protocol Versions</h4>
          <div className="text-muted small">Manage and track all protocol document versions</div>
        </div>
        <CButton
          color="primary"
          onClick={() => setUploadModalOpen(true)}
          disabled={!canUpload}
          title={!canUpload ? 'No site assigned. Please contact your administrator.' : 'Upload New Protocol'}
        >
          <CIcon icon={cilCloudUpload} className="me-2" />
          Upload New Protocol
        </CButton>
      </div>

      {!canUpload && (
        <div className="alert alert-warning mb-3">
          <strong>Upload Disabled:</strong> You need to be assigned to a site to upload documents.
          Please contact your administrator to assign you to a trial site.
        </div>
      )}

      <div className="bg-white rounded shadow-sm">
      <List
        resource="protocol-documents"
        title="Protocol Versions"
        pagination={false}
        perPage={100}
      >
        <ProtocolVersionsDatagrid
          documents={documents}
          isLoading={isLoading}
          onView={handleView}
        />
      </List>
      </div>

      <ProtocolUploadModal
        isOpen={uploadModalOpen}
        siteId={siteId}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

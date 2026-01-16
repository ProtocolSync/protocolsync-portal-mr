import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  TopToolbar,
  Title,
  useNotify
} from 'react-admin';
import {
  CButton,
  CBadge
} from '@coreui/react';
import { VersionBadge } from './VersionBadge';
import CIcon from '@coreui/icons-react';
import { cilCommentBubble, cilCloudDownload, cilArrowLeft } from '@coreui/icons';
import { ChatWidget } from '../widgets/ChatWidget';
import { useAuth } from '../contexts/AuthContext';
import '../widgets/ChatWidget/styles/ChatWidget.css';
import { protocolDocumentsService } from '../apiClient';

interface ProtocolVersion {
  id: string;
  versionNumber: string;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
  fileName: string;
  fileUrl?: string;
  recordHash?: string;
}

export const ProtocolDocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const notify = useNotify();

  const [versions, setVersions] = useState<ProtocolVersion[]>([]);
  const [documentName, setDocumentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string>('');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ProtocolVersion | null>(null);

  const refreshVersions = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Get JWT token for ChatWidget
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch (error) {
        console.error('Failed to acquire token:', error);
      }

      // Fetch document versions using ProtocolDocumentsService
      const response = await protocolDocumentsService.getProtocolVersions(id);

      if (response.success && response.data) {
        // Get document name from the first version
        const firstVersion = response.data[0];
        if (firstVersion) {
          setDocumentName(firstVersion.fileName?.replace(/\.[^/.]+$/, '') || 'Protocol Document');
        }

        // Transform versions to match our interface
        const transformedVersions = response.data.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          status: v.status,
          uploadedAt: v.uploadedAt,
          uploadedBy: v.uploadedBy,
          fileName: v.fileName,
          fileUrl: v.fileUrl,
          recordHash: v.recordHash
        }));

        setVersions(transformedVersions);
      } else {
        notify('Failed to load document versions', { type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching document versions:', error);
      notify('Failed to load document versions', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleOpenQueryModal = (version: ProtocolVersion) => {
    setSelectedVersion(version);
    setIsQueryModalOpen(true);
  };

  const handleCloseQueryModal = () => {
    setIsQueryModalOpen(false);
    setSelectedVersion(null);
  };

  const handleSetCurrent = async (versionId: string) => {
    try {
      const response = await protocolDocumentsService.updateVersionStatus(versionId, 'Current');

      if (!response.success) {
        throw new Error(response.error || 'Failed to update version status');
      }

      notify('Version set to Current successfully', { type: 'success' });

      // Refresh the versions list without full page reload
      await refreshVersions();
    } catch (error) {
      console.error('Error setting current:', error);
      notify(error instanceof Error ? error.message : 'Failed to update version status', { type: 'error' });
    }
  };

  const ListActions = () => (
    <TopToolbar>
      <CButton
        color="secondary"
        variant="outline"
        onClick={() => navigate('/protocols')}
      >
        <CIcon icon={cilArrowLeft} className="me-2" />
        Back to Protocol Versions
      </CButton>
    </TopToolbar>
  );

  return (
    <>
      <Title title={documentName ? `${documentName} - Versions` : 'Protocol Versions'} />
      <List
        resource="protocol-documents"
        title={documentName || 'Protocol Versions'}
        actions={<ListActions />}
        pagination={false}
        perPage={100}
      >
        <Datagrid 
          data={versions}
          isLoading={loading}
          bulkActionButtons={false}
          sx={{
            '& .RaDatagrid-table': { borderCollapse: 'collapse' },
            '& .RaDatagrid-headerCell': { fontWeight: 600, backgroundColor: 'transparent', borderBottom: '2px solid #dee2e6', padding: '0.75rem' },
            '& .RaDatagrid-rowCell': { padding: '0.75rem', borderBottom: '1px solid #dee2e6' },
            '& .RaDatagrid-row:hover': { backgroundColor: '#f8f9fa' },
          }}
        >
          <FunctionField 
            label="Version" 
            render={(record: ProtocolVersion) => 
              <VersionBadge version={record.versionNumber} />
            } 
          />
          <FunctionField
            label="Status"
            render={(record: ProtocolVersion) => (
              <CBadge color={record.status.toLowerCase() === 'current' ? 'success' : 'warning'}>
                {record.status.toLowerCase() === 'current' && '✓ '}
                {record.status}
              </CBadge>
            )}
          />
          <FunctionField
            label="Uploaded At"
            render={(record: ProtocolVersion) => 
              new Date(record.uploadedAt).toLocaleString()
            }
          />
          <TextField source="uploadedBy" label="Uploaded By" />
          <TextField source="fileName" label="File Name" />
          <FunctionField
            label="Record Hash (21 CFR Part 11)"
            render={(record: ProtocolVersion) => (
              <span className="font-mono text-xs text-text-subtle break-all block max-w-xs">
                {record.recordHash || 'Not available'}
              </span>
            )}
          />
          <FunctionField
            label="Actions"
            render={(record: ProtocolVersion) => {
              const isCurrent = record.status.toLowerCase() === 'current';
              return (
                <div className="flex gap-2 flex-wrap">
                  {isCurrent && (
                    <CButton
                      color="info"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenQueryModal(record)}
                    >
                      <CIcon icon={cilCommentBubble} className="me-1" />
                      Query
                    </CButton>
                  )}
                  {record.fileUrl && (
                    <CButton
                      color="primary"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(record.fileUrl!)}
                    >
                      <CIcon icon={cilCloudDownload} className="me-1" />
                      Download
                    </CButton>
                  )}
                  {!isCurrent && (
                    <CButton
                      color="success"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetCurrent(record.id)}
                    >
                      Set to Current
                    </CButton>
                  )}
                </div>
              );
            }}
          />
        </Datagrid>
      </List>

      <ChatWidget
        apiEndpoint={`${import.meta.env.VITE_API_URL}/query`}
        authToken={authToken}
        userId={user?.id}
        documentId={selectedVersion?.id || ''}
        documentName={selectedVersion ? `${documentName} - Version ${selectedVersion.versionNumber}` : ''}
        recordHash={selectedVersion?.recordHash}
        placeholder="Ask a question about this document version..."
        welcomeMessage={selectedVersion ? `Hi! I'm here to help you understand the ${documentName} protocol. What would you like to know?` : ''}
        theme="light"
        isModal={true}
        isOpen={isQueryModalOpen}
        onClose={handleCloseQueryModal}
      />
    </>
  );
};

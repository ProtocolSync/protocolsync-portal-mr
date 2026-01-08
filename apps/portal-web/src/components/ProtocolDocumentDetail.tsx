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
import { useMsal } from '@azure/msal-react';
import {
  CButton,
  CBadge
} from '@coreui/react';
import { VersionBadge } from './VersionBadge';
import CIcon from '@coreui/icons-react';
import { cilCommentBubble, cilCloudDownload, cilArrowLeft } from '@coreui/icons';
import { ChatWidget } from '../widgets/ChatWidget';
import { useUser } from '../contexts/UserContext';
import '../widgets/ChatWidget/styles/ChatWidget.css';

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
  const { instance } = useMsal();
  const { user } = useUser();
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

      // Get JWT token
      const accounts = instance.getAllAccounts();
      let token = '';

      if (accounts.length > 0) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0]
          });
          token = tokenResponse.accessToken;
          setAuthToken(token);
        } catch (error) {
          console.error('Failed to acquire token:', error);
        }
      }

      // Fetch document details
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const apiKey = import.meta.env.VITE_API_KEY;
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/document/${id}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document (${response.status}): ${response.statusText}`);
      }

      const rawData = await response.json();
      const doc = rawData.data || rawData;

      const docName = doc.document_type || doc.original_filename || 'Untitled';
      setDocumentName(docName);

      // Fetch all versions of this document type
      const allDocsResponse = await fetch(`${API_BASE_URL}/documents?limit=100`, {
        headers
      });

      if (allDocsResponse.ok) {
        const allDocsData = await allDocsResponse.json();
        const allDocs = allDocsData.data || allDocsData.documents || [];

        const getBaseName = (name: string) => {
          return name
            .replace(/\.pdf$/i, '')
            .replace(/\.docx?$/i, '')
            .replace(/\s*v?\d+\.\d+.*$/i, '')
            .trim()
            .toLowerCase();
        };

        const targetBaseName = getBaseName(docName);

        const sameTypeVersions = allDocs.filter((d: any) => {
          const dType = d.document_type || d.original_filename || '';
          const dBaseName = getBaseName(dType);
          return dBaseName === targetBaseName || dType.toLowerCase().trim() === docName.toLowerCase().trim();
        });

        if (sameTypeVersions.length === 0) {
          sameTypeVersions.push(doc);
        }

        const transformedVersions = sameTypeVersions
          .map((v: any) => ({
            id: v.document_id || v.id,
            versionNumber: v.document_version || 'N/A',
            status: v.status || 'uploaded',
            uploadedAt: v.upload_date || v.created_at || new Date().toISOString(),
            uploadedBy: v.uploaded_by_name || v.uploaded_by_email || (v.uploaded_by_user_id ? String(v.uploaded_by_user_id) : null) || 'System',
            fileName: v.original_filename || 'document.pdf',
            fileUrl: v.blob_url || v.file_url,
            recordHash: v.record_hash
          }))
          .sort((a: ProtocolVersion, b: ProtocolVersion) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );

        setVersions(transformedVersions);
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
  }, [id, instance, notify]);

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
      const accounts = instance.getAllAccounts();
      let authToken = '';

      if (accounts.length > 0) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0]
          });
          authToken = tokenResponse.accessToken;
        } catch (error) {
          console.error('Failed to acquire token:', error);
        }
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const apiKey = import.meta.env.VITE_API_KEY;
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/documents/${versionId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'Current' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update version status');
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
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  wordBreak: 'break-all',
                  display: 'block',
                  maxWidth: '300px'
                }}
              >
                {record.recordHash || 'Not available'}
              </span>
            )}
          />
          <FunctionField
            label="Actions"
            render={(record: ProtocolVersion) => {
              const isCurrent = record.status.toLowerCase() === 'current';
              return (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

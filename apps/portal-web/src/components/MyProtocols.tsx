import { useState, useEffect } from 'react';
import { 
  Title, 
  useNotify,
  Datagrid,
  TextField,
  FunctionField
} from 'react-admin';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useUser } from '../contexts/UserContext';
import { useMsal } from '@azure/msal-react';
import { 
  CButton,
  CBadge
} from '@coreui/react';
import { VersionBadge } from './VersionBadge';
import CIcon from '@coreui/icons-react';
import { cilCheckCircle, cilXCircle, cilCommentSquare } from '@coreui/icons';
import { ChatWidget } from '../widgets/ChatWidget';
import '../widgets/ChatWidget/styles/ChatWidget.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Protocol {
  id: string;
  delegationId: number;
  protocolName: string;
  documentType: string;
  versionNumber: string;
  status: string;
  delegatedRole: string;
  delegatedDate: string;
}

const MobileProtocolCard = ({ 
  protocol,
  actionLoading,
  onAcceptDecline,
  onOpenQuery
}: { 
  protocol: Protocol;
  actionLoading: number | null;
  onAcceptDecline: (delegationId: number, action: 'accept' | 'decline') => void;
  onOpenQuery: (protocol: Protocol) => void;
}) => {
  const statusColor = 
    protocol.status === 'accepted' ? 'success' : 
    protocol.status === 'pending' ? 'warning' : 
    protocol.status === 'declined' ? 'danger' : 
    'secondary';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{protocol.protocolName}</Typography>
          <Typography className="datagrid-card-subtitle">
            <VersionBadge version={protocol.versionNumber} />
          </Typography>
        </Box>
        <Box className="datagrid-card-actions">
          {protocol.status === 'pending' && (
            <>
              <CButton
                color="success"
                variant="ghost"
                size="sm"
                onClick={() => onAcceptDecline(protocol.delegationId, 'accept')}
                disabled={actionLoading === protocol.delegationId}
              >
                <CIcon icon={cilCheckCircle} className="me-1" />
                Accept
              </CButton>
              <CButton
                color="danger"
                variant="ghost"
                size="sm"
                onClick={() => onAcceptDecline(protocol.delegationId, 'decline')}
                disabled={actionLoading === protocol.delegationId}
              >
                <CIcon icon={cilXCircle} className="me-1" />
                Decline
              </CButton>
            </>
          )}
          <CButton
            color="info"
            variant="ghost"
            size="sm"
            onClick={() => onOpenQuery(protocol)}
          >
            <CIcon icon={cilCommentSquare} className="me-1" />
            Ask
          </CButton>
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Your Role</Typography>
          <Typography className="datagrid-card-value">{protocol.delegatedRole}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Delegated Date</Typography>
          <Typography className="datagrid-card-value">
            {new Date(protocol.delegatedDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={statusColor}>{protocol.status}</CBadge>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const MyProtocolsDatagrid = ({
  protocols,
  loading,
  actionLoading,
  onAcceptDecline,
  onOpenQuery
}: {
  protocols: Protocol[];
  loading: boolean;
  actionLoading: number | null;
  onAcceptDecline: (delegationId: number, action: 'accept' | 'decline') => void;
  onOpenQuery: (protocol: Protocol) => void;
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');

  if (isMobile) {
    return (
      <Box className="datagrid-list-container">
        {protocols.length === 0 ? (
          <div className="text-center py-5 text-muted">No protocols have been delegated to you</div>
        ) : (
          protocols.map((protocol: Protocol) => (
            <MobileProtocolCard
              key={protocol.id}
              protocol={protocol}
              actionLoading={actionLoading}
              onAcceptDecline={onAcceptDecline}
              onOpenQuery={onOpenQuery}
            />
          ))
        )}
      </Box>
    );
  }

  return (
    <Datagrid
      data={protocols}
      isLoading={loading}
      bulkActionButtons={false}
      resource="my-protocols"
      empty={<div className="text-center py-5 text-muted">No protocols have been delegated to you</div>}
      sx={{
        '& .RaDatagrid-table': { borderCollapse: 'collapse' },
        '& .RaDatagrid-headerCell': { fontWeight: 600, backgroundColor: 'transparent', borderBottom: '2px solid #dee2e6', padding: '0.75rem' },
        '& .RaDatagrid-rowCell': { padding: '0.75rem', borderBottom: '1px solid #dee2e6' },
        '& .RaDatagrid-row:hover': { backgroundColor: '#f8f9fa' },
      }}
    >
      <TextField source="protocolName" label="Protocol" />
      <FunctionField
        label="Version"
        render={(record: Protocol) => <VersionBadge version={record.versionNumber} />}
      />
      <TextField source="delegatedRole" label="Your Role" />
      <FunctionField
        label="Delegated Date"
        render={(record: Protocol) => new Date(record.delegatedDate).toLocaleDateString()}
      />
      <FunctionField
        label="Status"
        render={(record: Protocol) => (
          <CBadge color={
            record.status === 'accepted' ? 'success' : 
            record.status === 'pending' ? 'warning' : 
            record.status === 'declined' ? 'danger' : 
            'secondary'
          }>
            {record.status}
          </CBadge>
        )}
      />
      <FunctionField
        label="Actions"
        render={(record: Protocol) => (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {record.status === 'pending' && (
              <>
                <CButton
                  color="success"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAcceptDecline(record.delegationId, 'accept')}
                  disabled={actionLoading === record.delegationId}
                >
                  <CIcon icon={cilCheckCircle} className="me-1" />
                  Accept
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAcceptDecline(record.delegationId, 'decline')}
                  disabled={actionLoading === record.delegationId}
                >
                  <CIcon icon={cilXCircle} className="me-1" />
                  Decline
                </CButton>
              </>
            )}
            <CButton
              color="info"
              variant="ghost"
              size="sm"
              onClick={() => onOpenQuery(record)}
            >
              <CIcon icon={cilCommentSquare} className="me-1" />
              Ask Questions
            </CButton>
          </div>
        )}
      />
    </Datagrid>
  );
};

export const MyProtocols = () => {
  const { user } = useUser();
  const { instance } = useMsal();
  const notify = useNotify();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Get auth token
  useEffect(() => {
    const getToken = async () => {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0]
          });
          setAuthToken(response.accessToken);
        } catch (error) {
          console.error('Failed to acquire token:', error);
        }
      }
    };
    getToken();
  }, [instance]);

  const fetchDelegatedProtocols = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch delegations for this user
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${authToken}`,
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/compliance/delegations?user_id=${user.id}`,
        { headers }
      );
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const delegatedProtocols = data.data.map((delegation: any) => ({
          id: delegation.protocol_version_id,
          delegationId: delegation.delegation_id,
          protocolName: delegation.protocol_name || 'Untitled Protocol',
          documentType: delegation.protocol_type || 'Protocol',
          versionNumber: delegation.protocol_version || 'N/A',
          status: delegation.status,
          delegatedRole: delegation.delegated_job_title,
          delegatedDate: delegation.delegation_date
        }));
        
        setProtocols(delegatedProtocols);
      }
    } catch (error) {
      console.error('Error fetching delegated protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelegatedProtocols();
  }, [user, authToken]);

  const handleAcceptDecline = async (delegationId: number, action: 'accept' | 'decline') => {
    if (!user?.id) return;

    try {
      setActionLoading(delegationId);
      
      //const apiBaseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(
        `${API_BASE_URL}/compliance/delegation/${delegationId}/sign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': import.meta.env.VITE_API_KEY || ''
          },
          body: JSON.stringify({
            user_id: user.id,
            action: action,
            printed_name: user.displayName
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        notify(`Delegation ${action}ed successfully`, { type: 'success' });
        // Refresh the list
        await fetchDelegatedProtocols();
      } else {
        notify(data.error || `Failed to ${action} delegation`, { type: 'error' });
      }
    } catch (error) {
      console.error(`Error ${action}ing delegation:`, error);
      notify(`Failed to ${action} delegation`, { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const openQueryModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowQueryModal(true);
  };

  return (
    <div className="p-3">
      <Title title="My Protocols" />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4>My Delegated Protocols</h4>
          <div className="text-muted small">Protocols you have been delegated to work on</div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm">
        <MyProtocolsDatagrid
          protocols={protocols}
          loading={loading}
          actionLoading={actionLoading}
          onAcceptDecline={handleAcceptDecline}
          onOpenQuery={openQueryModal}
        />
      </div>

      {/* Chat Widget Modal */}
      {selectedProtocol && authToken && (
        <ChatWidget
          apiEndpoint={`${import.meta.env.VITE_API_URL}/query`}
          authToken={authToken}
          userId={user?.id}
          documentId={selectedProtocol.id}
          documentName={`${selectedProtocol.protocolName} (${selectedProtocol.versionNumber})`}
          placeholder="Ask a question about this protocol..."
          welcomeMessage={`Hi! I'm here to help you understand the ${selectedProtocol.protocolName} protocol. What would you like to know?`}
          theme="light"
          isModal={true}
          isOpen={showQueryModal}
          onClose={() => setShowQueryModal(false)}
        />
      )}
    </div>
  );
};

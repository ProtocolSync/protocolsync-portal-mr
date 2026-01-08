import { useState, useEffect } from 'react';
import { Title } from 'react-admin';
import { useUser } from '../contexts/UserContext';
import { useMsal } from '@azure/msal-react';
import { 
  CCard, 
  CCardBody, 
  CCardHeader, 
  CSpinner,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CRow,
  CCol
} from '@coreui/react';
import { VersionBadge } from './VersionBadge';
import { Box, Typography, useMediaQuery } from '@mui/material';

interface Delegation {
  delegation_id: number;
  protocol_version_id: number;
  document_master_id?: number;
  protocol_name: string;
  version_number?: string;
  protocol_version?: string;
  trial_role_name: string;
  delegation_date: string;
  effective_start_date: string;
  status: string;
}

const MobileDelegationCard = ({ delegation }: { delegation: Delegation }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'revoked':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{delegation.protocol_name}</Typography>
          <Typography className="datagrid-card-subtitle">
            <VersionBadge 
              version={delegation.version_number || delegation.protocol_version || 'N/A'}
            />
          </Typography>
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Role</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color="primary">{delegation.trial_role_name}</CBadge>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={getStatusColor(delegation.status)}>{delegation.status}</CBadge>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Delegation Date</Typography>
          <Typography className="datagrid-card-value">{formatDate(delegation.delegation_date)}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const SiteUserDashboard = () => {
  const { user } = useUser();
  const { instance } = useMsal();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:768px)');

  // Fetch delegated protocols on mount
  useEffect(() => {
    const fetchDelegations = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get auth token from MSAL
        const accounts = instance.getAllAccounts();
        let authToken = '';
        if (accounts.length > 0) {
          try {
            const tokenResponse = await instance.acquireTokenSilent({
              scopes: ['User.Read'],
              account: accounts[0]
            });
            authToken = tokenResponse.accessToken;
          } catch (error: any) {
            console.error('Failed to acquire token:', error);
            
            // Check if session expired
            if (error.name === 'InteractionRequiredAuthError' || 
                error.errorCode === 'interaction_required' ||
                error.message?.includes('interaction_required') ||
                error.message?.includes('AADSTS160021')) {
              console.log('[SiteUserDashboard] Session expired - logging out');
              await instance.logoutRedirect({
                postLogoutRedirectUri: '/'
              });
              return;
            }
          }
        }
        
        // Fetch delegations for this user
        const apiKey = import.meta.env.VITE_API_KEY;
        const headers: HeadersInit = {
          'Authorization': `Bearer ${authToken}`,
        };
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        const apiBaseUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiBaseUrl}/compliance/delegations?user_id=${user.id}`,
          { headers }
        );

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          console.log('[SiteUserDashboard] Authentication failed - logging out');
          await instance.logoutRedirect({
            postLogoutRedirectUri: '/'
          });
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch delegations');
        }

        const result = await response.json();
        console.log('Delegations API response:', result);
        setDelegations(result.data || result);
      } catch (error) {
        console.error('Error fetching delegations:', error);
        setDelegations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDelegations();
  }, [user]);

  return (
    <div className="datagrid-container">
      <Title title="ProtocolSync - Dashboard" />

      <div className="mb-4">
        <h1 className="fs-1 fw-bold mb-2">
          Dashboard
        </h1>
        <p className="text-medium-emphasis">
          View protocols delegated to you
        </p>
      </div>

      {/* Delegated Protocols */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">📑 My Delegated Protocols</h5>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading delegations...</p>
            </div>
          ) : delegations.length > 0 ? (
            <div>
              <CRow className="mb-4">
                <CCol xs="auto">
                  <div className="display-3 fw-bold text-success">
                    {delegations.length}
                  </div>
                </CCol>
                <CCol className="d-flex align-items-center">
                  <div>
                    <div className="text-medium-emphasis mb-1">
                      {delegations.length === 1 ? 'protocol' : 'protocols'} delegated to you
                    </div>
                    <div className="small text-medium-emphasis">
                      These are the protocols assigned for your review
                    </div>
                  </div>
                </CCol>
              </CRow>

              {isMobile ? (
                <Box className="datagrid-list-container">
                  {delegations.map((delegation) => (
                    <MobileDelegationCard 
                      key={delegation.delegation_id} 
                      delegation={delegation}
                    />
                  ))}
                </Box>
              ) : (
                <CTable hover responsive className="mt-3">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Protocol Name</CTableHeaderCell>
                    <CTableHeaderCell>Version</CTableHeaderCell>
                    <CTableHeaderCell>Role</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Delegation Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {delegations.map((delegation) => (
                    <CTableRow key={delegation.delegation_id}>
                      <CTableDataCell>
                        {delegation.protocol_name}
                      </CTableDataCell>
                      <CTableDataCell>
                        <VersionBadge version={delegation.protocol_version || delegation.version_number} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info">
                          {delegation.trial_role_name}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={delegation.status === 'accepted' ? 'success' : delegation.status === 'pending' ? 'warning' : delegation.status === 'declined' ? 'danger' : 'secondary'}>
                          {delegation.status}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-medium-emphasis">
                        {new Date(delegation.delegation_date).toLocaleDateString()}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
              )}
            </div>
          ) : (
            <p className="text-medium-emphasis text-center py-4">
              No protocols have been delegated to you yet
            </p>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

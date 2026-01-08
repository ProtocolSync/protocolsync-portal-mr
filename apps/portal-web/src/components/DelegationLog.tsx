import { useState, useEffect } from 'react';
import {
  Title,
  useNotify,
  Datagrid,
  TextField,
  FunctionField
} from 'react-admin';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { 
  CButton,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
  CFormSelect,
  CFormLabel,
  CFormInput
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilTask, cilCheckCircle, cilXCircle, cilPrint } from '@coreui/icons';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../contexts/UserContext';
import { VersionBadge } from './VersionBadge';

interface Delegation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  protocolVersionId: string;
  protocolName: string;
  protocolVersion?: string;
  jobTitle: string;
  delegationDate: string;
  delegatedBy: string;
  delegatedByName: string;
  signatureDate?: string;
  signatureIp?: string;
  status: 'pending' | 'signed' | 'revoked';
  createdAt: string;
  recordHash?: string;
}

const MobileDelegationCard = ({ 
  delegation, 
  currentUserId,
  canDelegate,
  onSign,
  onView,
  onRevoke
}: { 
  delegation: Delegation;
  currentUserId?: string;
  canDelegate: boolean;
  onSign: (id: string) => void;
  onView: (delegation: Delegation) => void;
  onRevoke: (delegation: Delegation) => void;
}) => {
  const statusColor = delegation.status === 'signed' ? 'success' : delegation.status === 'pending' ? 'warning' : 'danger';

  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{delegation.userName}</Typography>
          <Typography className="datagrid-card-subtitle">{delegation.userEmail}</Typography>
        </Box>
        <Box className="datagrid-card-actions">
          {delegation.userId === currentUserId && delegation.status === 'pending' && (
            <CButton color="success" variant="ghost" size="sm" onClick={() => onSign(delegation.id)}>
              <CIcon icon={cilCheckCircle} className="me-1" />
              Sign
            </CButton>
          )}
          <CButton color="info" variant="ghost" size="sm" onClick={() => onView(delegation)}>
            VIEW
          </CButton>
          {delegation.status !== 'revoked' && canDelegate && (
            <CButton color="danger" variant="ghost" size="sm" onClick={() => onRevoke(delegation)}>
              REVOKE
            </CButton>
          )}
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Job Title</Typography>
          <Typography className="datagrid-card-value">{delegation.jobTitle}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Protocol</Typography>
          <Typography className="datagrid-card-value">
            <div>{delegation.protocolName}</div>
            <div className="mt-1">
              <VersionBadge version={delegation.protocolVersion} />
            </div>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Delegated By</Typography>
          <Typography className="datagrid-card-value">{delegation.delegatedByName}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Delegation Date</Typography>
          <Typography className="datagrid-card-value">
            {new Date(delegation.delegationDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Status</Typography>
          <Typography className="datagrid-card-value">
            <CBadge color={statusColor}>
              {delegation.status === 'signed' && '✓ '}
              {delegation.status.charAt(0).toUpperCase() + delegation.status.slice(1)}
            </CBadge>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const DelegationsDatagrid = ({
  delegations,
  loading,
  currentUserId,
  canDelegate,
  onSign,
  onView,
  onRevoke
}: {
  delegations: Delegation[];
  loading: boolean;
  currentUserId?: string;
  canDelegate: boolean;
  onSign: (id: string) => void;
  onView: (delegation: Delegation) => void;
  onRevoke: (delegation: Delegation) => void;
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');

  if (isMobile) {
    return (
      <Box className="datagrid-list-container">
        {delegations.map((delegation: Delegation) => (
          <MobileDelegationCard
            key={delegation.id}
            delegation={delegation}
            currentUserId={currentUserId}
            canDelegate={canDelegate}
            onSign={onSign}
            onView={onView}
            onRevoke={onRevoke}
          />
        ))}
      </Box>
    );
  }

  return (
    <Datagrid
      data={delegations}
      isLoading={loading}
      bulkActionButtons={false}
      sx={{
        '& .RaDatagrid-table': { borderCollapse: 'collapse' },
        '& .RaDatagrid-headerCell': { fontWeight: 600, backgroundColor: 'transparent', borderBottom: '2px solid #dee2e6', padding: '0.75rem' },
        '& .RaDatagrid-rowCell': { padding: '0.75rem', borderBottom: '1px solid #dee2e6' },
        '& .RaDatagrid-row:hover': { backgroundColor: '#f8f9fa' },
      }}
      resource="delegations"
    >
      <FunctionField
        label="Staff Member"
        render={(record: Delegation) => (
          <div>
            <div className="fw-semibold">{record.userName}</div>
            <div className="small text-muted">{record.userEmail}</div>
          </div>
        )}
      />
      <TextField source="jobTitle" label="Job Title" />
      <FunctionField
        label="Protocol"
        render={(record: Delegation) => (
          <div>
            <div>{record.protocolName}</div>
            <div className="mt-1">
              <VersionBadge version={record.protocolVersion} />
            </div>
          </div>
        )}
      />
      <TextField source="delegatedByName" label="Delegated By" />
      <FunctionField
        label="Delegation Date"
        render={(record: Delegation) => new Date(record.delegationDate).toLocaleDateString()}
      />
      <FunctionField
        label="Status"
        render={(record: Delegation) => (
          <CBadge color={record.status === 'signed' ? 'success' : record.status === 'pending' ? 'warning' : 'danger'}>
            {record.status === 'signed' && '✓ '}
            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
          </CBadge>
        )}
      />
      <FunctionField
        label="Actions"
        render={(record: Delegation) => (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {record.userId === currentUserId && record.status === 'pending' && (
              <CButton color="success" variant="ghost" size="sm" onClick={() => onSign(record.id)}>
                <CIcon icon={cilCheckCircle} className="me-1" />
                Sign
              </CButton>
            )}
            <CButton color="info" variant="ghost" size="sm" onClick={() => onView(record)}>
              VIEW
            </CButton>
            {record.status !== 'revoked' && canDelegate && (
              <CButton color="danger" variant="ghost" size="sm" onClick={() => onRevoke(record)}>
                REVOKE
              </CButton>
            )}
          </div>
        )}
      />
    </Datagrid>
  );
};

export const DelegationLog = () => {
  const { user } = useUser();
  const { instance } = useMsal();
  const notify = useNotify();

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    reportTitle: '',
    scopeFilter: 'current',
    dateFrom: '',
    dateTo: '',
    protocolId: '',
    userFilter: '',
    includeAuditTrail: true,
    reportFormat: 'pdf-signed'
  });
  const [formData, setFormData] = useState({ userId: '', protocolVersionId: '', jobTitle: '' });
  const [viewingDelegation, setViewingDelegation] = useState<Delegation | null>(null);
  const [revokingDelegation, setRevokingDelegation] = useState<Delegation | null>(null);
  const [protocolVersions, setProtocolVersions] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const getAuthToken = async () => {
    const accounts = instance.getAllAccounts();
    if (accounts.length === 0) return '';
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      return '';
    }
  };

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      const response = await fetch(`${API_BASE_URL}/compliance/delegations`, { headers });
      if (!response.ok) throw new Error(`Failed to fetch delegations (${response.status})`);
      const data = await response.json();
      console.log('[DelegationLog] Raw API response:', data);
      const rawDelegations = data.data || data.delegations || [];
      console.log('[DelegationLog] Raw delegations array:', rawDelegations);
      const transformedDelegations = rawDelegations.map((d: any) => ({
        id: d.id || d.delegation_id,
        userId: d.user_id || d.userId,
        userName: d.user_name || d.userName || d.delegated_user_name || 'Unknown',
        userEmail: d.user_email || d.userEmail || d.delegated_user_email || '',
        protocolVersionId: d.protocol_version_id || d.protocolVersionId || '',
        protocolName: d.protocol_name || 'Unknown Protocol',
        protocolVersion: d.protocol_version,
        jobTitle: d.delegated_job_title || d.user_current_job_title || 'Not Specified',
        delegationDate: d.delegation_date || d.delegationDate || d.created_at || '',
        delegatedBy: d.delegated_by || d.delegatedBy || '',
        delegatedByName: d.delegated_by_name || d.delegatedByName || d.delegator_name || 'Unknown',
        signatureDate: d.signature_date || d.signatureDate,
        signatureIp: d.signature_ip || d.signatureIp,
        status: (d.status || 'pending').toLowerCase() === 'accepted' ? 'signed' : ((d.status || 'pending').toLowerCase() as 'pending' | 'signed' | 'revoked'),
        createdAt: d.created_at || d.createdAt || '',
        recordHash: d.record_hash || d.recordHash
      }));
      console.log('[DelegationLog] Transformed delegations:', transformedDelegations);
      setDelegations(transformedDelegations);
    } catch (error) {
      console.error('Error fetching delegations:', error);
      notify('Failed to load delegation log', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProtocolVersions = async () => {
    try {
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      const response = await fetch(`${API_BASE_URL}/compliance/protocol-versions`, { headers });
      if (response.ok) {
        const data = await response.json();
        setProtocolVersions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch protocol versions:', error);
    }
  };

  const fetchSiteUsers = async () => {
    try {
      const token = await getAuthToken();
      const siteId = user?.site?.id;
      if (!siteId) return;
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/users`, { headers });
      if (response.ok) {
        const data = await response.json();
        const userList = Array.isArray(data) ? data : (data.data || []);

        // Include current user if they are site_admin or admin
        // This allows single-user scenarios where admin/site_admin delegates to themselves
        const filteredUsers = userList;

        // Add current user if not already in the list and they have delegation permissions
        const currentUserInList = filteredUsers.some((u: any) => u.email === user?.email);
        if (!currentUserInList && user && ['admin', 'site_admin'].includes(user.role || '')) {
          filteredUsers.push({
            user_id: user.id,
            email: user.email,
            full_name: user.displayName,
            name: user.displayName,
            job_title: '', // Job title will be entered during delegation
            role: user.role
          });
        }

        setSiteUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Failed to fetch site users:', error);
    }
  };

  useEffect(() => {
    fetchDelegations();
    fetchProtocolVersions();
    if (user) fetchSiteUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const userLookupResponse = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/api/users?email=${encodeURIComponent(formData.userId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      if (!userLookupResponse.ok) throw new Error('User not found');
      const staffUser = await userLookupResponse.json();
      const delegatedUserId = staffUser.user_id || staffUser.id;

      const response = await fetch(`${API_BASE_URL}/compliance/delegation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          delegated_by_user_id: user?.id,
          delegated_user_id: delegatedUserId,
          protocol_version_id: parseInt(formData.protocolVersionId),
          delegated_job_title: formData.jobTitle,
          task_description: `Delegated as ${formData.jobTitle}`,
          effective_start_date: new Date().toISOString().split('T')[0],
          effective_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          training_required: false
        })
      });
      if (!response.ok) throw new Error('Failed to create delegation');
      notify('Delegation created successfully', { type: 'success' });
      setShowForm(false);
      setFormData({ userId: '', protocolVersionId: '', jobTitle: '' });
      fetchDelegations();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to create delegation', { type: 'error' });
    }
  };

  const handleSign = async (delegationId: string) => {
    try {
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      const response = await fetch(`${API_BASE_URL}/compliance/delegation/${delegationId}/sign`, {
        method: 'POST',
        headers
      });
      if (!response.ok) throw new Error('Failed to sign delegation');
      notify('Delegation signed successfully', { type: 'success' });
      fetchDelegations();
    } catch (error) {
      notify('Failed to sign delegation', { type: 'error' });
    }
  };

  const handleRevoke = async (delegationId: string) => {
    try {
      const token = await getAuthToken();
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      const response = await fetch(`${API_BASE_URL}/compliance/delegation/${delegationId}/revoke`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ revoked_by_user_id: user?.id, revocation_reason: 'Revoked by authorized personnel' })
      });
      if (!response.ok) throw new Error('Failed to revoke delegation');
      notify('Delegation revoked successfully', { type: 'success' });
      setRevokingDelegation(null);
      fetchDelegations();
    } catch (error) {
      notify('Failed to revoke delegation', { type: 'error' });
    }
  };

  const canDelegate = [ 'admin', 'site_admin', 'site_user' ].includes(user?.role || '');
  const myPendingDelegations = delegations.filter(d => d.userId === user?.id && d.status === 'pending');

  const handleGenerateReport = async () => {
    try {
      const token = await getAuthToken();
      
      // Set default report title if empty
      const title = printConfig.reportTitle || `Delegation Log - ${new Date().toLocaleDateString()}`;
      
      const payload = {
        userId: user?.id,
        reportTitle: title,
        scopeFilter: printConfig.scopeFilter,
        dateFrom: printConfig.dateFrom || null,
        dateTo: printConfig.dateTo || null,
        protocolId: printConfig.protocolId || null,
        userFilter: printConfig.userFilter || null,
        includeAuditTrail: printConfig.includeAuditTrail,
        reportFormat: printConfig.reportFormat
      };

      console.log('[Generate Report] Payload:', payload);

      const response = await fetch(`${API_BASE_URL}/reports/delegation-log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start report generation');
      }

      const data = await response.json();
      console.log('[Generate Report] Response:', data);

      notify('Report generation started. Download will begin shortly...', { type: 'info' });
      setShowPrintModal(false);

      // Poll for report completion
      const reportId = data.data.report_id;
      pollReportStatus(reportId, token);

    } catch (error) {
      console.error('[Generate Report] Error:', error);
      notify(error instanceof Error ? error.message : 'Failed to generate report', { type: 'error' });
    }
  };

  const pollReportStatus = async (reportId: string, token: string) => {
    const maxAttempts = 30; // 30 seconds timeout
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        
        const response = await fetch(`${API_BASE_URL}/reports/status/${reportId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-API-Key': import.meta.env.VITE_API_KEY
          }
        });

        if (!response.ok) throw new Error('Failed to check report status');

        const data = await response.json();
        const status = data.data.status;

        console.log(`[Poll Report] Attempt ${attempts}: ${status}`);

        if (status === 'completed') {
          notify('Report generated successfully! Downloading...', { type: 'success' });
          // Trigger download
          // Download with headers using fetch, then trigger browser download
          try {
            const downloadResponse = await fetch(`${API_BASE_URL}/reports/download/${reportId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-API-Key': import.meta.env.VITE_API_KEY
              }
            });
            if (!downloadResponse.ok) throw new Error('Failed to download report');
            const blob = await downloadResponse.blob();
            // Try to get filename from Content-Disposition header
            // Use report title or fallback to reportId
            let filename = printConfig.reportTitle?.trim()
              ? printConfig.reportTitle.trim().replace(/[^a-zA-Z0-9-_\.]/g, '_') + '.pdf'
              : (reportId ? `${reportId}.pdf` : 'delegation-report.pdf');
            // If Content-Disposition header provides a filename, prefer it
            const disposition = downloadResponse.headers.get('Content-Disposition');
            if (disposition && disposition.indexOf('filename=') !== -1) {
              const match = disposition.match(/filename="?([^";]+)"?/);
              if (match && match[1]) filename = match[1];
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            notify('Failed to download report', { type: 'error' });
          }
        } else if (status === 'failed') {
          notify('Report generation failed: ' + (data.data.error_message || 'Unknown error'), { type: 'error' });
        } else if (attempts < maxAttempts) {
          // Still generating, check again in 1 second
          setTimeout(checkStatus, 1000);
        } else {
          notify('Report generation is taking longer than expected. Please check back later.', { type: 'warning' });
        }
      } catch (error) {
        console.error('[Poll Report] Error:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000);
        }
      }
    };

    checkStatus();
  };

  return (
    <div className="p-3">
      <Title title="Delegation of Authority Log" />
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4>Delegation of Authority Log</h4>
          <div className="text-muted small">Electronic DOA Log - FDA 21 CFR Part 11 Compliant</div>
        </div>
        <div className="d-flex gap-2">
          <CButton color="info" variant="outline" onClick={() => setShowPrintModal(true)}>
            <CIcon icon={cilPrint} className="me-2" />
            Generate Report
          </CButton>
          {canDelegate && (
            <CButton color="primary" onClick={() => setShowForm(true)}>
              <CIcon icon={cilTask} className="me-2" />
              + Assign Task
            </CButton>
          )}
        </div>
      </div>
      
      {myPendingDelegations.length > 0 && (
        <div className="mb-3">
          <CAlert color="warning">
            <strong>You have {myPendingDelegations.length} pending delegation{myPendingDelegations.length > 1 ? 's' : ''} requiring your signature</strong>
            <div className="small mt-1">Please review and electronically sign to acknowledge your assigned responsibilities.</div>
          </CAlert>
        </div>
      )}

      <div className="bg-white rounded shadow-sm">
        <DelegationsDatagrid
          delegations={delegations}
          loading={loading}
          currentUserId={user?.id}
          canDelegate={canDelegate}
          onSign={handleSign}
          onView={setViewingDelegation}
          onRevoke={setRevokingDelegation}
        />
      </div>

      <div className="mt-3">
        <CAlert color="info">
          <small><strong>📋 Regulatory Compliance:</strong> Electronic DOA Log - FDA 21 CFR Part 11 Compliant</small>
        </CAlert>
      </div>

      <CModal visible={showForm} onClose={() => setShowForm(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Create New Delegation</CModalTitle>
        </CModalHeader>
        <form onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel>Staff Member *</CFormLabel>
              <CFormSelect
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                required
              >
                <option value="">Select staff member...</option>
                {siteUsers.map((u) => (
                  <option key={u.user_id} value={u.email}>
                    {u.full_name || u.name}
                    {u.job_title ? ` - ${u.job_title}` : ''}
                    {` (${u.email})`}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel>Protocol Version *</CFormLabel>
              <CFormSelect
                value={formData.protocolVersionId}
                onChange={(e) => setFormData({ ...formData, protocolVersionId: e.target.value })}
                required
              >
                <option value="">Select protocol version...</option>
                {protocolVersions.map((p) => (
                  <option key={p.version_id} value={p.version_id}>{p.display_name} - {p.current_status}</option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel>Job Title *</CFormLabel>
              <CFormInput
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g., Principal Investigator, Study Coordinator, etc."
                required
              />
              <small className="text-muted">Enter the staff member's job title for this delegation</small>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowForm(false)}>Cancel</CButton>
            <CButton color="primary" type="submit">Create Delegation</CButton>
          </CModalFooter>
        </form>
      </CModal>

      <CModal visible={!!viewingDelegation} onClose={() => setViewingDelegation(null)} size="lg">
        <CModalHeader>
          <CModalTitle>Delegation Record Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {viewingDelegation && (
            <div className="d-flex flex-column gap-3">
              <div>
                <div className="small text-muted">Delegation ID</div>
                <div className="font-monospace">{viewingDelegation.id}</div>
              </div>
              <div>
                <div className="small text-muted">Staff Member</div>
                <div className="fw-semibold">{viewingDelegation.userName}</div>
                <div className="small">{viewingDelegation.userEmail}</div>
              </div>
              <div className="row">
                <div className="col-6">
                  <div className="small text-muted">Job Title</div>
                  <div>{viewingDelegation.jobTitle}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">Protocol</div>
                  <div>{viewingDelegation.protocolName}</div>
                  <div className="mt-1">
                    <VersionBadge version={viewingDelegation.protocolVersion} />
                  </div>
                </div>
              </div>
              <div>
                <div className="small text-muted">Delegated By</div>
                <div>{viewingDelegation.delegatedByName}</div>
                <div className="small">{new Date(viewingDelegation.delegationDate).toLocaleString()}</div>
              </div>
              {viewingDelegation.status === 'signed' && viewingDelegation.signatureDate && (
                <CAlert color="success">
                  <strong>✓ Electronic Signature</strong><br />
                  Signed: {new Date(viewingDelegation.signatureDate).toLocaleString()}<br />
                  {viewingDelegation.signatureIp && `IP Address: ${viewingDelegation.signatureIp}`}
                </CAlert>
              )}
              <div>
                <div className="small text-muted">Record Hash (21 CFR Part 11 Compliance)</div>
                <div
                  className="font-monospace small text-break"
                  style={{
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    wordBreak: 'break-all'
                  }}
                >
                  {viewingDelegation.recordHash || 'Not available'}
                </div>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setViewingDelegation(null)}>Close</CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!revokingDelegation} onClose={() => setRevokingDelegation(null)}>
        <CModalHeader>
          <CModalTitle>⚠️ Revoke Delegation</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {revokingDelegation && (
            <div className="d-flex flex-column gap-3">
              <CAlert color="danger">
                <strong>Warning: This action cannot be undone</strong>
                <div className="small mt-1">Revoking this delegation will immediately terminate the staff member's assigned responsibilities.</div>
              </CAlert>
              <div className="p-3 bg-light rounded">
                <div className="fw-semibold">{revokingDelegation.userName}</div>
                <div className="small">Job Title: {revokingDelegation.jobTitle}</div>
                <div className="small d-flex align-items-center gap-2">
                  <span>Protocol: {revokingDelegation.protocolName}</span>
                  <VersionBadge version={revokingDelegation.protocolVersion} />
                </div>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setRevokingDelegation(null)}>Cancel</CButton>
          <CButton color="danger" onClick={() => revokingDelegation && handleRevoke(revokingDelegation.id)}>
            <CIcon icon={cilXCircle} className="me-1" />
            Revoke Delegation
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Print Report Modal */}
      <CModal visible={showPrintModal} onClose={() => setShowPrintModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>🖨️ Generate Delegation Report</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex flex-column gap-4">
            <CAlert color="info">
              <strong>FDA 21 CFR Part 11 Compliant Report</strong>
              <div className="small mt-1">
                Configure your official delegation log report. This document will include electronic signatures 
                and audit trails suitable for regulatory inspections.
              </div>
            </CAlert>

            <div>
              <CFormLabel className="fw-semibold">Report Title / Name *</CFormLabel>
              <input 
                type="text" 
                className="form-control" 
                placeholder={`Delegation Log - ${new Date().toLocaleDateString()}`}
                value={printConfig.reportTitle}
                onChange={(e) => setPrintConfig({...printConfig, reportTitle: e.target.value})}
              />
              <div className="small text-muted mt-1">
                Internal name for this report (e.g., "FDA Audit Q3 2025", "Protocol VV4.0 Delegation Log")
              </div>
            </div>

            <div>
              <CFormLabel className="fw-semibold">Scope Filter</CFormLabel>
              <CFormSelect
                value={printConfig.scopeFilter}
                onChange={(e) => setPrintConfig({...printConfig, scopeFilter: e.target.value})}
              >
                <option value="current">Current View/Filters Applied</option>
                <option value="all">All Delegations (Ignore Current Filters)</option>
                <option value="active">Active Delegations Only</option>
                <option value="pending">Pending Delegations Only</option>
                <option value="signed">Signed Delegations Only</option>
                <option value="revoked">Revoked Delegations Only</option>
              </CFormSelect>
              <div className="small text-muted mt-1">
                Defines which delegations are included in the report
              </div>
            </div>

            <div>
              <CFormLabel className="fw-semibold">Date Range</CFormLabel>
              <div className="d-flex gap-2 align-items-end">
                <div className="flex-fill">
                  <CFormLabel className="small">From</CFormLabel>
                  <input 
                    type="date" 
                    className="form-control"
                    value={printConfig.dateFrom}
                    onChange={(e) => setPrintConfig({...printConfig, dateFrom: e.target.value})}
                  />
                </div>
                <div className="flex-fill">
                  <CFormLabel className="small">To</CFormLabel>
                  <input 
                    type="date" 
                    className="form-control"
                    value={printConfig.dateTo}
                    onChange={(e) => setPrintConfig({...printConfig, dateTo: e.target.value})}
                  />
                </div>
              </div>
              <div className="small text-muted mt-1">
                Defines the period covered by the report. Leave blank for "All Time"
              </div>
            </div>

            <div>
              <CFormLabel className="fw-semibold">Protocol Filter</CFormLabel>
              <CFormSelect
                value={printConfig.protocolId}
                onChange={(e) => setPrintConfig({...printConfig, protocolId: e.target.value})}
              >
                <option value="">All Protocols</option>
                {protocolVersions.map((pv: any) => (
                  <option key={pv.id} value={pv.id}>
                    {pv.protocol_name} - {pv.version_number}
                  </option>
                ))}
              </CFormSelect>
              <div className="small text-muted mt-1">Optional: Filter by specific protocol version</div>
            </div>

            <div>
              <CFormLabel className="fw-semibold">User Filter</CFormLabel>
              <CFormSelect
                value={printConfig.userFilter}
                onChange={(e) => setPrintConfig({...printConfig, userFilter: e.target.value})}
              >
                <option value="">All Users</option>
                {siteUsers.map((su: any) => (
                  <option key={su.id} value={su.id}>
                    {su.full_name || su.name} ({su.email})
                  </option>
                ))}
              </CFormSelect>
              <div className="small text-muted mt-1">Optional: Filter by specific delegated user</div>
            </div>

            <div className="border-top pt-3">
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="includeAuditTrail"
                  checked={printConfig.includeAuditTrail}
                  onChange={(e) => setPrintConfig({...printConfig, includeAuditTrail: e.target.checked})}
                />
                <label className="form-check-label fw-semibold" htmlFor="includeAuditTrail">
                  Include Full Audit Trail
                </label>
                <div className="small text-muted ms-4">
                  Include complete e-signature audit trail for each delegation. 
                  <strong className="text-warning"> Required for FDA 21 CFR Part 11 compliance.</strong>
                </div>
              </div>
            </div>

            <div>
              <CFormLabel className="fw-semibold">Report Format</CFormLabel>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="reportFormat" 
                    id="formatPdfSigned"
                    value="pdf-signed"
                    checked={printConfig.reportFormat === 'pdf-signed'}
                    onChange={(e) => setPrintConfig({...printConfig, reportFormat: e.target.value})}
                  />
                  <label className="form-check-label" htmlFor="formatPdfSigned">
                    <strong>PDF (Signed)</strong> - Recommended for regulatory audits
                    <div className="small text-muted">Includes digital signature and tamper-evident seal</div>
                  </label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="reportFormat" 
                    id="formatPdf"
                    value="pdf"
                    checked={printConfig.reportFormat === 'pdf'}
                    onChange={(e) => setPrintConfig({...printConfig, reportFormat: e.target.value})}
                  />
                  <label className="form-check-label" htmlFor="formatPdf">
                    <strong>PDF (Standard)</strong> - Printable document
                    <div className="small text-muted">No digital signature, suitable for internal use</div>
                  </label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="reportFormat" 
                    id="formatCsv"
                    value="csv"
                    checked={printConfig.reportFormat === 'csv'}
                    onChange={(e) => setPrintConfig({...printConfig, reportFormat: e.target.value})}
                  />
                  <label className="form-check-label" htmlFor="formatCsv">
                    <strong>CSV (Excel)</strong> - Data export
                    <div className="small text-muted">Raw data for analysis, not suitable for regulatory submission</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowPrintModal(false)}>
            Cancel
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleGenerateReport}
          >
            <CIcon icon={cilPrint} className="me-2" />
            {printConfig.reportFormat === 'pdf-signed' ? 'Generate Signed PDF' : 
             printConfig.reportFormat === 'pdf' ? 'Download PDF' : 
             'Download CSV'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

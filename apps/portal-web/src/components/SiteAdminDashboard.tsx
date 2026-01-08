import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { Title } from 'react-admin';
import { CSpinner, CBadge } from '@coreui/react';
import { useUser } from '../contexts/UserContext';
import { Box, Typography, useMediaQuery } from '@mui/material';

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  protocol_number?: string;
  phase?: string;
  status: string;
  pi_name?: string;
  assigned_user_count: number;
  document_count?: number;
  created_at: string;
}

const MobileTrialCard = ({ trial, getPhaseColor, getStatusColor }: { trial: Trial; getPhaseColor: (phase?: string) => string; getStatusColor: (status: string) => string }) => {
  return (
    <Box className="datagrid-card">
      <Box className="datagrid-card-header">
        <Box>
          <Typography className="datagrid-card-title">{trial.trial_name}</Typography>
          <Typography className="datagrid-card-subtitle">{trial.trial_number}</Typography>
        </Box>
      </Box>
      <Box className="datagrid-card-details">
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Protocol</Typography>
          <Typography className="datagrid-card-value">{trial.protocol_number || '-'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Phase</Typography>
          <Typography className="datagrid-card-value">
            {trial.phase ? (
              <CBadge color={getPhaseColor(trial.phase)}>{trial.phase}</CBadge>
            ) : (
              <span className="text-[#9ca3af]">-</span>
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
          <Typography className="datagrid-card-label">PI</Typography>
          <Typography className="datagrid-card-value">
            {trial.pi_name || <span className="text-[#9ca3af] italic">Not assigned</span>}
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Team Members</Typography>
          <Typography className="datagrid-card-value">
            <span className="inline-flex items-center px-2 py-1 rounded bg-[#e0e7ff] text-[#3730a3] font-medium text-xs">
              {trial.assigned_user_count} {trial.assigned_user_count === 1 ? 'member' : 'members'}
            </span>
          </Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">Documents</Typography>
          <Typography className="datagrid-card-value">{trial.document_count || 0}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const SiteAdminDashboard = () => {
  const { user } = useUser();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trials on mount
  useEffect(() => {
    const fetchTrials = async () => {
      try {
        setLoading(true);

        const API_BASE_URL = import.meta.env.VITE_API_URL;
        if (!API_BASE_URL) {
          throw new Error('VITE_API_URL environment variable is not set');
        }

        const apiKey = import.meta.env.VITE_API_KEY;
        const headers: HeadersInit = {};
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }

        // Get user ID from UserContext
        const userId = user?.id;

        const url = userId
          ? `${API_BASE_URL}/trials?user_id=${userId}&status=active`
          : `${API_BASE_URL}/trials?status=active`;

        console.log('[SiteAdminDashboard] Fetching trials for user_id:', userId);
        const response = await fetch(url, { headers });
        const result = await response.json();

        console.log('[SiteAdminDashboard] Trials data:', result);

        if (result.success && result.data) {
          setTrials(result.data);
        } else {
          setTrials([]);
        }
      } catch (error) {
        console.error('Error fetching trials:', error);
        setTrials([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchTrials();
    }
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const isMobile = useMediaQuery('(max-width:768px)');

  return (
    <div className="datagrid-container">
      <Title title="ProtocolSync - Site Admin Dashboard" />

      <div className="mb-4">
        <h1 className="fs-1 fw-bold mb-2">
          Site Admin Dashboard
        </h1>
        <p className="text-medium-emphasis">
          Manage your clinical trials and site operations
        </p>
      </div>

      {/* Active Trials Overview */}
      <Card className="mb-4">
        <CardHeader>
          <h2 className="fs-5 fw-semibold m-0">
            🔬 Active Trials
          </h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="d-flex justify-content-center p-4">
              <CSpinner color="primary" />
            </div>
          ) : trials.length > 0 ? (
            <div>
              <div className="flex items-center gap-8 mb-4">
                <div className="text-[72px] font-bold text-[#10b981] leading-none">
                  {trials.filter(t => t.status === 'active').length}
                </div>
                <div>
                  <div className="text-base text-[#6b7280] mb-1">
                    active {trials.filter(t => t.status === 'active').length === 1 ? 'trial' : 'trials'} at this site
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Total trials: {trials.length}
                  </div>
                </div>
              </div>

              {isMobile ? (
                <Box className="datagrid-list-container">
                  {trials.map((trial) => (
                    <MobileTrialCard 
                      key={trial.trial_id} 
                      trial={trial}
                      getPhaseColor={getPhaseColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </Box>
              ) : (
                <table className="w-full border-collapse mt-6">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b-2 border-[#d1d5db]">
                    <th className="text-left p-3 text-sm font-semibold">
                      Trial Number
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Trial Name
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Protocol
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Phase
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Status
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      PI
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Team Members
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((trial) => (
                    <tr key={trial.trial_id} className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
                      <td className="p-3 text-sm font-medium">
                        {trial.trial_number}
                      </td>
                      <td className="p-3 text-sm">
                        {trial.trial_name}
                      </td>
                      <td className="p-3 text-sm text-[#6b7280]">
                        {trial.protocol_number || '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {trial.phase ? (
                          <CBadge color={getPhaseColor(trial.phase)}>
                            {trial.phase}
                          </CBadge>
                        ) : (
                          <span className="text-[#9ca3af]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        <CBadge color={getStatusColor(trial.status)}>
                          {trial.status}
                        </CBadge>
                      </td>
                      <td className="p-3 text-sm text-[#6b7280]">
                        {trial.pi_name || <span className="text-[#9ca3af] italic">Not assigned</span>}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-[#e0e7ff] text-[#3730a3] font-medium text-xs">
                          {trial.assigned_user_count} {trial.assigned_user_count === 1 ? 'member' : 'members'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-[#6b7280]">
                        {trial.document_count || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#6b7280] mb-4">
                No trials found at this site
              </p>
              <p className="text-sm text-[#9ca3af]">
                Create a new trial to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="row g-4">
        <div className="col-md-6">
          <Card>
            <CardHeader>
              <h3 className="fs-6 fw-semibold m-0">
                🆕 Quick Actions
              </h3>
            </CardHeader>
            <CardContent>
              <div className="d-flex flex-column gap-2">
                <a
                  href="/#/trials"
                  className="btn btn-primary btn-sm d-flex align-items-center justify-content-between"
                >
                  <span>Create New Trial</span>
                  <span>→</span>
                </a>
                <a
                  href="/#/site-users"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-between"
                >
                  <span>Manage Site Users</span>
                  <span>→</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-6">
          <Card>
            <CardHeader>
              <h3 className="fs-6 fw-semibold m-0">
                📊 Site Summary
              </h3>
            </CardHeader>
            <CardContent>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-sm text-[#6b7280]">Total Trials</span>
                  <span className="fw-bold text-lg">{trials.length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-sm text-[#6b7280]">Active Trials</span>
                  <span className="fw-bold text-lg text-[#10b981]">
                    {trials.filter(t => t.status === 'active').length}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-sm text-[#6b7280]">Total Team Members</span>
                  <span className="fw-bold text-lg">
                    {trials.reduce((sum, t) => sum + (t.assigned_user_count || 0), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

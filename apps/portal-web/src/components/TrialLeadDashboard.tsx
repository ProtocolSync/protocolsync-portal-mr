import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { Title } from 'react-admin';
import { CSpinner, CBadge } from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { trialsService } from '../apiClient';

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
  trial_role?: string;
  site_name?: string;
  created_at: string;
}

const MobileAssignedTrialCard = ({ trial, getPhaseColor, getStatusColor }: { trial: Trial; getPhaseColor: (phase?: string) => string; getStatusColor: (status: string) => string }) => {
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
          <Typography className="datagrid-card-label">Site</Typography>
          <Typography className="datagrid-card-value">{trial.site_name || '-'}</Typography>
        </Box>
        <Box className="datagrid-card-detail-row">
          <Typography className="datagrid-card-label">My Role</Typography>
          <Typography className="datagrid-card-value">
            {trial.trial_role ? (
              <CBadge color="primary">{trial.trial_role}</CBadge>
            ) : (
              <span className="text-[#9ca3af]">-</span>
            )}
          </Typography>
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

export const TrialLeadDashboard = () => {
  const { user } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch trials on mount
  useEffect(() => {
    const fetchTrials = async () => {
      try {
        setLoading(true);

        // Get user ID from AuthContext
        const userId = user?.id;

        if (!userId) {
          console.error('[TrialLeadDashboard] No user ID found');
          setTrials([]);
          setLoading(false);
          return;
        }

        // Fetch only trials this user is assigned to using TrialsService
        console.log('[TrialLeadDashboard] Fetching trials for user_id:', userId);
        const response = await trialsService.getTrials({ userId });

        console.log('[TrialLeadDashboard] Trials data:', response);

        if (response.success && response.data) {
          // Filter to only active trials
          const activeTrials = response.data.filter((t: Trial) =>
            t.status === 'active' || t.status === 'enrolling'
          );
          setTrials(activeTrials);
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
      case 'enrolling':
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
      <Title title="ProtocolSync - Trial Lead Dashboard" />

      <div className="mb-4">
        <h1 className="fs-1 fw-bold mb-2">
          Trial Lead Dashboard
        </h1>
        <p className="text-medium-emphasis">
          Manage protocol versions and delegations for your assigned trials
        </p>
      </div>

      {/* My Trials Overview */}
      <Card className="mb-4">
        <CardHeader>
          <h2 className="fs-5 fw-semibold m-0">
            🔬 My Assigned Trials
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
                  {trials.length}
                </div>
                <div>
                  <div className="text-base text-[#6b7280] mb-1">
                    active {trials.length === 1 ? 'trial' : 'trials'} assigned to you
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    You can manage protocol versions and delegations for these trials
                  </div>
                </div>
              </div>

              {isMobile ? (
                <Box className="datagrid-list-container">
                  {trials.map((trial) => (
                    <MobileAssignedTrialCard
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
                      Site
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      My Role
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Phase
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Status
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
                        {trial.site_name || '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {trial.trial_role ? (
                          <CBadge color="primary" className="text-xs">
                            {trial.trial_role}
                          </CBadge>
                        ) : (
                          <span className="text-[#9ca3af]">-</span>
                        )}
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
                      <td className="p-3 text-sm text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#e0e7ff] text-[#3730a3] text-xs font-medium">
                          {trial.assigned_user_count || 0}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-center text-[#6b7280]">
                        {trial.document_count || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="text-[48px] mb-3">🔬</div>
              <h3 className="fs-5 fw-semibold mb-2">No Trials Assigned</h3>
              <p className="text-medium-emphasis mb-4">
                You haven't been assigned to any trials yet. Contact your site administrator to be assigned to trials.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {trials.length > 0 && (
        <div className="row g-3">
          <div className="col-md-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/protocols')}
            >
              <CardContent>
                <div className="d-flex align-items-center">
                  <div className="text-[48px] me-3">📄</div>
                  <div>
                    <h3 className="fs-5 fw-semibold mb-1">Protocol Versions</h3>
                    <p className="text-medium-emphasis mb-0 text-sm">
                      Manage protocol documents and versions for your trials
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-md-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/delegation-log')}
            >
              <CardContent>
                <div className="d-flex align-items-center">
                  <div className="text-[48px] me-3">✍️</div>
                  <div>
                    <h3 className="fs-5 fw-semibold mb-1">Delegation Log</h3>
                    <p className="text-medium-emphasis mb-0 text-sm">
                      Track and manage delegation of authority for your trials
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

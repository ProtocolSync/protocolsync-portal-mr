import { useNavigate } from 'react-router-dom';
import { Title, useGetList } from 'react-admin';
import { useAuth } from '../contexts/AuthContext';
import { CSpinner, CRow, CCol, CButton } from '@coreui/react';
import { Card, CardContent, CardHeader } from './Card';

interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalAdmins: number;
  totalUsers: number;
  subscriptionStatus: string;
  nextBillingDate: string;
}

export const CROAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch sites
  const { data: sites, isLoading: sitesLoading } = useGetList(
    'sites',
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'site_name', order: 'ASC' },
      filter: {},
      meta: { companyId: user?.company?.id }
    },
    { enabled: !!user?.company?.id }
  );

  // Fetch site administrators
  const { data: admins, isLoading: adminsLoading } = useGetList(
    'site-administrators',
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'full_name', order: 'ASC' },
      filter: {},
      meta: { companyId: user?.company?.id }
    },
    { enabled: !!user?.company?.id }
  );

  // Fetch users
  const { data: users, isLoading: usersLoading } = useGetList(
    'users',
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'full_name', order: 'ASC' },
      filter: {},
      meta: { companyId: user?.company?.id }
    },
    { enabled: !!user?.company?.id }
  );

  const isLoading = sitesLoading || adminsLoading || usersLoading;

  // Calculate stats from real data
  const stats: DashboardStats = {
    totalSites: sites?.length || 0,
    activeSites: sites?.filter((s: any) => s.status === 'active').length || 0,
    totalAdmins: admins?.length || 0,
    totalUsers: users?.length || 0,
    subscriptionStatus: 'active', // TODO: Get from user company data
    nextBillingDate: '2025-12-15' // TODO: Get from user company data
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-h-[400px]">
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Title title="CRO Admin Dashboard" />
      
      <div className="mb-4">
        <h1 className="fs-1 fw-bold mb-2">
          CRO Admin Dashboard
        </h1>
        <p className="text-medium-emphasis">
          Overview of all sites, administrators, and billing
        </p>
      </div>

      {/* Overview Statistics */}
      <Card className="mb-4">
        <CardHeader>
          <h2 className="fs-5 fw-semibold m-0">
            Overview Statistics
          </h2>
        </CardHeader>
        <CardContent>
          <CRow className="g-4">
            {/* Total Sites */}
            <CCol md={6} lg={3}>
              <div
                onClick={() => navigate('/sites')}
                className="p-4 border border-2 rounded bg-white cursor-pointer transition-all hover:border-success hover:shadow"
              >
                <p className="text-medium-emphasis small mb-2 fw-medium">Total Sites</p>
                <p className="display-4 fw-bold my-2">{stats.totalSites}</p>
                <p className="small text-success m-0 fw-semibold">
                  {stats.activeSites} active
                </p>
              </div>
            </CCol>

            {/* Site Administrators */}
            <CCol md={6} lg={3}>
              <div
                onClick={() => navigate('/site-administrators')}
                className="p-4 border border-2 rounded bg-white cursor-pointer transition-all hover:border-primary hover:shadow"
              >
                <p className="text-medium-emphasis small mb-2 fw-medium">Site Administrators</p>
                <p className="display-4 fw-bold my-2">{stats.totalAdmins}</p>
              </div>
            </CCol>

            {/* Total Users */}
            <CCol md={6} lg={3}>
              <div
                onClick={() => navigate('/users')}
                className="p-4 border border-2 rounded bg-white cursor-pointer transition-all hover:border-purple-500 hover:shadow"
              >
                <p className="text-medium-emphasis small mb-2 fw-medium">Total Users</p>
                <p className="display-4 fw-bold my-2">{stats.totalUsers}</p>
              </div>
            </CCol>

            {/* Billing Status */}
            <CCol md={6} lg={3}>
              <div
                onClick={() => navigate('/billing')}
                className="p-4 border border-2 rounded bg-white cursor-pointer transition-all hover:border-warning hover:shadow"
              >
                <p className="text-medium-emphasis small mb-2 fw-medium">Billing Status</p>
                <p className="fs-3 fw-bold my-2 text-capitalize">
                  {stats.subscriptionStatus}
                </p>
                <p className="small text-medium-emphasis m-0">
                  Next billing: {new Date(stats.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            </CCol>
          </CRow>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="fs-5 fw-semibold m-0">
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent>
          <CRow className="g-3">
            <CCol md={6} lg={3}>
              <CButton
                color="success"
                variant="outline"
                className="w-100 d-flex align-items-center justify-content-start gap-2 p-3"
                onClick={() => navigate('/sites')}
              >
                <span className="text-2xl">🏥</span>
                <span>Manage Sites</span>
              </CButton>
            </CCol>

            <CCol md={6} lg={3}>
              <CButton
                color="primary"
                variant="outline"
                className="w-100 d-flex align-items-center justify-content-start gap-2 p-3"
                onClick={() => navigate('/site-administrators')}
              >
                <span className="text-2xl">👤</span>
                <span>Manage Site Administrators</span>
              </CButton>
            </CCol>

            <CCol md={6} lg={3}>
              <CButton
                color="info"
                variant="outline"
                className="w-100 d-flex align-items-center justify-content-start gap-2 p-3"
                onClick={() => navigate('/users')}
              >
                <span className="text-2xl">👥</span>
                <span>Manage Users</span>
              </CButton>
            </CCol>

            <CCol md={6} lg={3}>
              <CButton
                color="warning"
                variant="outline"
                className="w-100 d-flex align-items-center justify-content-start gap-2 p-3"
                onClick={() => navigate('/billing')}
              >
                <span className="text-2xl">💳</span>
                <span>Manage Billing</span>
              </CButton>
            </CCol>
          </CRow>
        </CardContent>
      </Card>
    </div>
  );
};

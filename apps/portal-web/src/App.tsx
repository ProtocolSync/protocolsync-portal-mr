import { Admin, Resource, CustomRoutes } from 'react-admin';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { Route } from 'react-router-dom';
import { createTheme } from '@mui/material/styles';
import { msalConfig } from './authConfig';
import { protocolSyncProvider, initializeDataProvider } from './dataProvider';
import { initializeApiClient } from './apiClient';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomLayout } from './components/CustomLayout';
import { SiteAdminDashboard } from './components/SiteAdminDashboard';
import { TrialLeadDashboard } from './components/TrialLeadDashboard';
import { SiteUserDashboard } from './components/SiteUserDashboard';
import { CROAdminDashboard } from './components/CROAdminDashboard';
import { ProtocolVersionManagement } from './components/ProtocolVersionManagement';
import { ProtocolDocumentDetail } from './components/ProtocolDocumentDetail';
import { MyProtocols } from './components/MyProtocols';
import { DelegationLog } from './components/DelegationLog';
import { Reports } from './components/Reports';
import { Users } from './components/Users';
import { Sites } from './components/Sites';
import { SiteUsers } from './components/SiteUsers';
import { SiteAdministrators } from './components/SiteAdministrators';
import { Trials } from './components/Trials';
import { Billing } from './components/Billing';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { designTokens } from '@protocolsync/shared-styles/design-tokens';

// Verify API key is loaded
console.log('🔑 API Configuration Check:');
console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('- VITE_API_KEY:', import.meta.env.VITE_API_KEY ? 
  `${import.meta.env.VITE_API_KEY.substring(0, 15)}... (${import.meta.env.VITE_API_KEY.length} chars)` : 
  '❌ NOT FOUND - RESTART DEV SERVER!');

// Custom theme using design tokens
const theme = createTheme({
  palette: {
    primary: {
      main: designTokens.color.brand.primary,
    },
    secondary: {
      main: designTokens.color.brand.secondary,
    },
    background: {
      default: designTokens.color.background.page,
      paper: designTokens.color.background.card,
    },
    text: {
      primary: designTokens.color.text.default,
      secondary: designTokens.color.text.subtle,
    },
  },
  typography: {
    fontFamily: `"${designTokens.typography.fontFamily.primary}", sans-serif`,
    fontSize: 14,
    htmlFontSize: 14,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: designTokens.color.brand.accentGreen,
          color: designTokens.color.text.inverse,
        },
      },
    },
  },
});

// Initialize MSAL instance with error handling
let msalInstance: PublicClientApplication;
try {
  msalInstance = new PublicClientApplication(msalConfig);
  
  // Handle redirect promise and prevent any automatic redirects
  msalInstance.initialize().then(() => {
    // Handle any redirect results but don't navigate
    msalInstance.handleRedirectPromise().then((response) => {
      if (response) {
        console.log('Redirect response handled:', response);
      }
    }).catch((error) => {
      console.error('Redirect promise error:', error);
    });
    
    // Initialize data provider with MSAL instance
    initializeDataProvider(msalInstance);

    // Initialize API client with MSAL instance
    initializeApiClient(msalInstance);
    
    // Account selection logic is app dependent. Adjust as needed for your use case.
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }

    msalInstance.addEventCallback((event: any) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
        console.log('Login success event - active account set:', account.username);
      }
    });
  });
} catch (error) {
  console.error('MSAL initialization error:', error);
  // Fallback to a minimal config
  msalInstance = new PublicClientApplication({
    auth: {
      clientId: '00000000-0000-0000-0000-000000000000',
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  });
}

// Component to determine which dashboard to show based on active role
const DashboardRouter = () => {
  const { user } = useAuth();
  const { activeRole } = useRole();
  
  console.log('[DashboardRouter] User object:', user);
  console.log('[DashboardRouter] User role:', user?.role);
  console.log('[DashboardRouter] Active role:', activeRole);
  
  // Route to appropriate dashboard based on active role (not user's actual role)
  if (activeRole === 'admin') {
    return <CROAdminDashboard />;
  }

  if (activeRole === 'site_admin') {
    return <SiteAdminDashboard />;
  }

  if (activeRole === 'trial_lead') {
    return <TrialLeadDashboard />;
  }

  // Default to site user dashboard for site_user role
  return <SiteUserDashboard />;
};

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <RoleProvider>
          <ProtectedRoute>
            <Admin 
              dataProvider={protocolSyncProvider} 
              dashboard={DashboardRouter}
              layout={CustomLayout}
              title="ProtocolSync Portal"
              theme={theme}
            >
            {/* Register resources for React Admin */}
            <Resource name="users" list={Users} />
            <Resource name="site-users" list={SiteUsers} />
            <Resource name="sites" list={Sites} />
            <Resource name="site-administrators" list={SiteAdministrators} />
            <Resource name="trials" list={Trials} />

            {/* Routes for both CRO admins and site administrators */}
            <CustomRoutes>
              {/* Protocol Version Management - trial leads only */}
              <Route path="/protocols" element={<ProtocolVersionManagement />} />
              <Route path="/protocols/:id" element={<ProtocolDocumentDetail />} />

              {/* My Protocols - site users only */}
              <Route path="/my-protocols" element={<MyProtocols />} />

              {/* Delegation Log - trial leads only */}
              <Route path="/delegation-log" element={<DelegationLog />} />

              {/* Reports - CRO Admin and Site Admin */}
              <Route path="/reports" element={<Reports />} />

              {/* Billing - CRO Admin */}
              <Route path="/billing" element={<Billing />} />
            </CustomRoutes>
          </Admin>
          </ProtectedRoute>
        </RoleProvider>
      </AuthProvider>
    </MsalProvider>
  );
}

export default App;

import type { ReactNode } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { Login } from './Login';
import { useUser } from '../contexts/UserContext';
import { CSpinner, CContainer } from '@coreui/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Set to true to bypass authentication for demo purposes
const DEMO_MODE = false;

/**
 * ProtectedRoute component ensures users are authenticated before accessing content
 * If not authenticated, it shows the Login page
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const { user, loading, error } = useUser();

  // Demo mode bypass - remove this in production
  if (DEMO_MODE) {
    return <>{children}</>;
  }

  // Show login page if not authenticated with Azure AD
  if (!isAuthenticated || accounts.length === 0) {
    return <Login />;
  }

  // User is authenticated with Azure AD, now check if they exist in our database
  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <CSpinner color="primary" />
          <p className="mt-3">Loading your profile...</p>
        </div>
      </CContainer>
    );
  }

  // User authenticated with Azure AD but not found in database
  // Don't clear the cache or logout - just show login page with error
  if (error || !user) {
    return <Login />;
  }

  // User is authenticated AND exists in database, show the protected content
  return <>{children}</>;
};

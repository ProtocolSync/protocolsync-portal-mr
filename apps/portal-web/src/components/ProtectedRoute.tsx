import type { ReactNode } from 'react';
import { Login } from './Login';
import { useAuth } from '../contexts/AuthContext';
import { CSpinner, CContainer } from '@coreui/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component ensures users are authenticated before accessing content
 * If not authenticated, it shows the Login page
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading, error } = useAuth();

  // Show login page if not authenticated
  if (!isAuthenticated && !loading) {
    return <Login />;
  }

  // Show loading spinner while fetching profile
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

  // User authenticated but profile error or not found in database
  if (error || !user) {
    return <Login />;
  }

  // User is authenticated AND exists in database, show the protected content
  return <>{children}</>;
};

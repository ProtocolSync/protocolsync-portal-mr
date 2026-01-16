/**
 * @deprecated This file is deprecated. Use AuthContext instead.
 *
 * Migration guide:
 * - Replace: import { useUser } from '../contexts/UserContext';
 * - With:    import { useAuth } from '../contexts/AuthContext';
 *
 * - Replace: const { user, loading, error, refreshUser } = useUser();
 * - With:    const { user, loading, error, refreshUser } = useAuth();
 *
 * AuthContext provides the same interface plus additional methods:
 * - login(): Trigger MSAL login popup
 * - logout(): Logout and redirect
 * - getToken(): Get current access token
 * - isAuthenticated: Boolean indicating auth state
 */

// Re-export from AuthContext for backward compatibility
export { useAuth as useUser, AuthProvider as UserProvider } from './AuthContext';
export type { User as UserProfile } from '@protocolsync/shared-types';

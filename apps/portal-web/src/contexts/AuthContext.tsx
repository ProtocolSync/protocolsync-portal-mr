import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import type { User } from '@protocolsync/shared-types';
import { SessionService } from '@protocolsync/shared-services';
import { loginRequest, apiScopes } from '../authConfig';
import { setClientId, setUserId } from '../dataProvider';
import { apiClient } from '../apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create session service using shared apiClient
const sessionService = new SessionService(apiClient);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const isAuthenticated = accounts.length > 0 && user !== null;

  const handleLogout = useCallback(async () => {
    try {
      console.log('[AuthContext] Logging out user');
      setUser(null);
      setError(null);
      await instance.logoutRedirect({
        postLogoutRedirectUri: '/'
      });
    } catch (logoutError) {
      console.error('[AuthContext] Error during logout:', logoutError);
      setUser(null);
      window.location.href = '/';
    }
  }, [instance]);

  const fetchUserProfile = useCallback(async (account?: AccountInfo) => {
    try {
      setLoading(true);
      setError(null);

      const currentAccounts = account ? [account] : instance.getAllAccounts();
      if (currentAccounts.length === 0) {
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Fetching user profile from:', `${API_BASE_URL}/user/profile`);

      // Fetch user profile using shared service
      const response = await sessionService.getUserProfile();

      if (!response.success || !response.data) {
        const errorMessage = response.error || 'Failed to fetch user profile';
        throw new Error(errorMessage);
      }

      const userData = response.data;
      console.log('[AuthContext] User profile fetched:', userData);
      console.log('[AuthContext] Role:', userData.role);

      setUser(userData);

      // Set client ID for multi-tenant filtering
      if (userData.clientId) {
        setClientId(userData.clientId);
        console.log('[AuthContext] Client ID set:', userData.clientId);
      }

      // Set user ID for authentication
      if (userData.id) {
        setUserId(parseInt(userData.id));
        console.log('[AuthContext] User ID set:', userData.id);
      }
    } catch (err: unknown) {
      console.error('[AuthContext] Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [instance]);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[AuthContext] Starting Azure AD login...');

      const response = await instance.loginPopup(loginRequest);
      console.log('[AuthContext] Azure AD login successful:', response);

      // Set the active account
      if (response.account) {
        instance.setActiveAccount(response.account);
        console.log('[AuthContext] Active account set:', response.account.username);

        // Fetch user profile after successful login
        await fetchUserProfile(response.account);
      }

      console.log('[AuthContext] Login complete');
    } catch (err: unknown) {
      console.error('[AuthContext] Login failed:', err);
      setLoading(false);

      // Only show error if it's not a user cancellation
      const msalError = err as { errorCode?: string };
      if (msalError.errorCode !== 'user_cancelled') {
        setError('Login failed. Please try again.');
      }
    }
  }, [instance, fetchUserProfile]);

  const logout = handleLogout;

  const refreshUser = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchUserProfile();
  }, [fetchUserProfile]);

  const getToken = useCallback(async (): Promise<string> => {
    const currentAccounts = instance.getAllAccounts();
    if (currentAccounts.length === 0) {
      throw new Error('No authenticated accounts');
    }

    const tokenResponse = await instance.acquireTokenSilent({
      scopes: apiScopes,
      account: currentAccounts[0]
    });

    return tokenResponse.accessToken;
  }, [instance]);

  // Auto-fetch user profile when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUserProfile();
    } else if (accounts.length === 0) {
      hasFetchedRef.current = false;
      setLoading(false);
      setUser(null);
      setError(null);
    }
  }, [accounts.length, fetchUserProfile]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

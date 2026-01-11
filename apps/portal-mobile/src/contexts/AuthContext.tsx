import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PublicClientApplication from 'react-native-msal';
import { msalConfig } from '../config/authConfig';
import { session } from '../services/apiClient';

export interface UserProfile {
  id: string;
  user_id?: number;
  azureAdUserId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'site_admin' | 'trial_lead' | 'site_user';
  clientId: string;
  client: {
    name: string;
    organizationType: string;
  };
  company?: {
    id: string;
    name: string;
    code: string;
    subscriptionTier: string;
  };
  site?: {
    id: string;
    number: string;
    name: string;
  };
  lastLogin?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔧 Initializing MSAL...');
      console.log('🔍 Environment check:');
      console.log('  - CLIENT_ID:', msalConfig.auth.clientId?.substring(0, 8) + '...');
      console.log('  - AUTHORITY:', msalConfig.auth.authority);

      if (!msalConfig.auth.clientId || msalConfig.auth.clientId === '') {
        throw new Error('AZURE_CLIENT_ID is not configured. Please check your .env file.');
      }
      if (msalConfig.auth.authority.includes('your-azure-tenant-id')) {
        throw new Error('AZURE_TENANT_ID is not configured. Please check your .env file.');
      }

      await msalInstance.init();
      console.log('✅ MSAL initialized');

      // Check if user is already authenticated
      const accounts = await msalInstance.getAccounts();
      if (accounts && accounts.length > 0) {
        console.log('✅ User already authenticated:', accounts[0].username);
        setIsAuthenticated(true);
        await fetchUserProfile(accounts[0]);
      } else {
        console.log('ℹ️ No authenticated user found');
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      console.error('❌ Error initializing auth:', err);
      setError('Failed to initialize authentication');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Starting login...');

      const result = await msalInstance.acquireToken({
        scopes: ['User.Read'],
      });

      if (!result || !result.account) {
        throw new Error('Login result is invalid');
      }

      console.log('✅ Login successful:', result.account.username);
      setIsAuthenticated(true);
      await fetchUserProfile(result.account);
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      if (err?.errorCode !== 'user_cancelled' && err?.message !== 'User cancelled') {
        setError('Login failed. Please try again.');
      }
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Logging out...');

      // Logout from backend session
      await session.logout();

      // Logout from MSAL
      const accounts = await msalInstance.getAccounts();
      if (accounts && accounts.length > 0) {
        await msalInstance.signOut({
          account: accounts[0],
        });
      }
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      console.log('✅ Logout successful');
    } catch (err: any) {
      console.error('❌ Logout failed:', err);
      // Force logout locally even if MSAL fails
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const fetchUserProfile = async (account: any) => {
    try {
      console.log('🔄 Fetching user profile...');

      // Get access token for API calls
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: account,
      });

      if (!tokenResponse) {
        throw new Error('Failed to acquire token');
      }

      // First, establish a session with the backend using the JWT token
      console.log('🔄 Establishing session with backend...');
      const sessionResponse = await session.loginWithJWT(tokenResponse.accessToken);

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.error || 'Failed to establish session');
      }

      console.log('✅ Session established');
      const result = sessionResponse.data;
      console.log('✅ User profile fetched:', result);

      // Extract and restructure the nested API response
      const apiData = result.data || result;
      const userData = apiData.user || apiData;

      // Map API response to UserProfile interface
      const userProfile: UserProfile = {
        id: userData.id?.toString() || userData.user_id?.toString(),
        user_id: userData.user_id || userData.id,
        azureAdUserId: userData.azure_ad_object_id,
        email: userData.email,
        displayName: userData.name,
        role: userData.role,
        clientId: apiData.company?.company_id?.toString() || '',
        client: {
          name: apiData.company?.company_name || '',
          organizationType: 'CRO',
        },
        company: apiData.company ? {
          id: apiData.company.company_id?.toString(),
          name: apiData.company.company_name,
          code: apiData.company.company_code,
          subscriptionTier: apiData.company.subscription_tier,
        } : undefined,
        site: apiData.site ? {
          id: apiData.site.site_id?.toString(),
          number: apiData.site.site_number,
          name: apiData.site.site_name,
        } : undefined,
        lastLogin: userData.last_login_at,
      };

      console.log('✅ Mapped user profile:', userProfile);
      setUser(userProfile);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching user profile:', err);
      setError(err.message || 'Failed to load user profile');

      // If it's an access error, log out
      if (err.message?.includes('Access denied') || err.message?.includes('403')) {
        await logout();
      }
    }
  };

  const refreshUser = async () => {
    const accounts = await msalInstance.getAccounts();
    if (accounts && accounts.length > 0) {
      await fetchUserProfile(accounts[0]);
    }
  };

  const getToken = async (): Promise<string> => {
    try {
      const accounts = await msalInstance.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No authenticated accounts found');
      }

      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0],
      });

      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

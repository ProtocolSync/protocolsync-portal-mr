import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { setClientId, setUserId } from '../dataProvider';
import type { User } from '@protocolsync/shared-types';

// Use the shared User type as UserProfile
export type UserProfile = User;

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const UserProvider = ({ children }: UserProviderProps) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const handleLogout = async () => {
    try {
      console.log('[UserContext] Session expired or error occurred - logging out user');
      setUser(null);
      setError(null);
      // Clear all local state
      await instance.logoutRedirect({
        postLogoutRedirectUri: '/'
      });
    } catch (logoutError) {
      console.error('[UserContext] Error during logout:', logoutError);
      // Force clear local state even if logout fails
      setUser(null);
      window.location.href = '/';
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentAccounts = instance.getAllAccounts();
      if (currentAccounts.length === 0) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Get access token for API calls
      let tokenResponse;
      try {
        tokenResponse = await instance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: currentAccounts[0]
        });
      } catch (tokenError: any) {
        console.error('[UserContext] Token acquisition failed:', tokenError);
        
        // Check if it's an interaction required error (session expired)
        if (tokenError.name === 'InteractionRequiredAuthError' || 
            tokenError.errorCode === 'interaction_required' ||
            tokenError.message?.includes('interaction_required') ||
            tokenError.message?.includes('AADSTS160021')) {
          console.log('[UserContext] Session expired - logging out user');
          await handleLogout();
          return;
        }
        
        // Re-throw other errors
        throw tokenError;
      }

      console.log('[UserContext] Fetching user profile from:', `${API_BASE_URL}/user/profile`);
      console.log('[UserContext] Using token:', tokenResponse.accessToken.substring(0, 50) + '...');
      console.log('[UserContext] Account info:', {
        username: currentAccounts[0].username,
        name: currentAccounts[0].name,
        localAccountId: currentAccounts[0].localAccountId,
        homeAccountId: currentAccounts[0].homeAccountId
      });

      // Fetch user profile from backend
      const apiKey = import.meta.env.VITE_API_KEY;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${tokenResponse.accessToken}`,
        'Content-Type': 'application/json'
      };
      
      // Add API key if available
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
        console.log('[UserContext] Added API key to request');
      } else {
        console.error('[UserContext] ⚠️ VITE_API_KEY not found - request will fail!');
      }
      
      const response = await fetch(`${API_BASE_URL}/user/profile`, { headers });

      console.log('[UserContext] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch user profile';

        try {
          const errorData = await response.json();
          console.error('[UserContext] Error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorData
          });

          // Extract error message from response
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try text
          const errorText = await response.text();
          console.error('[UserContext] Error response (text):', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(errorMessage || 'Access denied. You are not authorized to access this system.');
        }
        if (response.status === 404) {
          throw new Error(errorMessage || 'User profile not found. Please contact your administrator to set up your account.');
        }
        throw new Error(errorMessage || `Failed to fetch user profile: ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log('[UserContext] Raw response data:', rawData);
      
      // Extract the actual data from the response wrapper
      const responseData = rawData.data || rawData;
      
      console.log('[UserContext] Multi-tenant structure:', {
        'user.role': responseData.user?.role,
        'company': responseData.company,
        'site': responseData.site
      });
      
      // Transform backend response to UserProfile format
      // New multi-tenant structure: company/site instead of client
      const data: UserProfile = {
        id: responseData.user?.user_id || responseData.user?.id || responseData.id,
        azureAdUserId: responseData.user?.azure_ad_object_id || responseData.azureAdUserId || responseData.azure_ad_user_id,
        email: responseData.user?.email || responseData.email,
        displayName: responseData.user?.full_name || responseData.user?.name || responseData.displayName || responseData.display_name || responseData.name,
        role: responseData.user?.role || responseData.role?.name || responseData.role_name || 'site_user',
        clientId: responseData.company?.company_id?.toString() || responseData.client?.client_id || responseData.clientId || responseData.client_id || '',
        client: {
          name: responseData.company?.company_name || responseData.client?.client_name || responseData.client?.name || responseData.client_name || 'Unknown Client',
          organizationType: responseData.company?.subscription_tier || responseData.client?.organization_type || responseData.client?.organizationType || 'research_site'
        },
        company: responseData.company ? {
          id: responseData.company.company_id?.toString() || '',
          name: responseData.company.company_name || '',
          code: responseData.company.company_code || '',
          subscriptionTier: responseData.company.subscription_tier || ''
        } : undefined,
        site: responseData.site ? {
          id: responseData.site.site_id?.toString() || '',
          number: responseData.site.site_number || '',
          name: responseData.site.site_name || ''
        } : undefined,
        lastLogin: responseData.user?.last_login_at || responseData.user?.last_login || responseData.lastLogin || responseData.last_login
      };
      
      console.log('[UserContext] Transformed user profile:', data);
      console.log('[UserContext] Role:', data.role);
      setUser(data);
      
      // Set client ID for multi-tenant filtering
      if (data.clientId) {
        setClientId(data.clientId);
        console.log('[UserContext] Client ID set:', data.clientId);
      }
      
      // Set user ID for authentication
      if (data.id) {
        setUserId(parseInt(data.id));
        console.log('[UserContext] User ID set:', data.id);
      }
    } catch (err: any) {
      console.error('[UserContext] Error fetching user profile:', err);

      // Don't automatically trigger logout on errors
      // Let the user see the error and try again
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [instance]);

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

  const refreshUser = useCallback(() => {
    hasFetchedRef.current = false;
    return fetchUserProfile();
  }, [fetchUserProfile]);

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

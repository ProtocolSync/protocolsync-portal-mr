/**
 * API Client Instance for Web
 * Uses shared ApiClient from @protocolsync/shared-services
 */

import { ApiClient, SitesService, UsersService, TrialsService } from '@protocolsync/shared-services';
import type { IPublicClientApplication } from '@azure/msal-browser';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

// Global MSAL instance - will be set after user logs in
let msalInstance: IPublicClientApplication | null = null;

/**
 * Initialize the API client with MSAL instance
 * Call this in App.tsx after MSAL initialization
 */
export const initializeApiClient = (instance: IPublicClientApplication) => {
  msalInstance = instance;
};

// Create API client with shared ApiClient
export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  getToken: async () => {
    if (!msalInstance) {
      throw new Error('MSAL not initialized');
    }

    try {
      const accounts = msalInstance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No authenticated user');
      }

      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0],
      });

      if (!tokenResponse?.accessToken) {
        throw new Error('Failed to acquire token');
      }

      // Also store token for backward compatibility with existing code
      sessionStorage.setItem('auth_token', tokenResponse.accessToken);

      return tokenResponse.accessToken;
    } catch (error: any) {
      console.error('Failed to get token:', error);

      // Check if it's a session expiration error
      if (error.name === 'InteractionRequiredAuthError' ||
          error.errorCode === 'interaction_required' ||
          error.message?.includes('interaction_required') ||
          error.message?.includes('AADSTS160021')) {
        console.log('[ApiClient] Session expired - redirecting to logout');
        // Logout and redirect to home
        await msalInstance.logoutRedirect({
          postLogoutRedirectUri: '/'
        });
      }

      throw error;
    }
  },
  getSessionId: async () => {
    try {
      return sessionStorage.getItem('session_id') || localStorage.getItem('session_id');
    } catch (error) {
      console.warn('Failed to get session ID:', error);
      return null;
    }
  },
  onUnauthorized: async () => {
    // Clear session and token
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('session_id');
    localStorage.removeItem('auth_token');

    // Logout via MSAL
    if (msalInstance) {
      await msalInstance.logoutRedirect({
        postLogoutRedirectUri: '/'
      });
    }
  },
});

// Export service instances
export const sitesService = new SitesService(apiClient);
export const usersService = new UsersService(apiClient);
export const trialsService = new TrialsService(apiClient);

// Export convenient API methods for backward compatibility
export const api = {
  get: <T = any>(endpoint: string) => apiClient.get<T>(endpoint),
  post: <T = any>(endpoint: string, body?: any) => apiClient.post<T>(endpoint, body),
  put: <T = any>(endpoint: string, body?: any) => apiClient.put<T>(endpoint, body),
  patch: <T = any>(endpoint: string, body?: any) => apiClient.patch<T>(endpoint, body),
  delete: <T = any>(endpoint: string) => apiClient.delete<T>(endpoint),
};

// Session management
export const session = {
  async loginWithJWT(token: string) {
    try {
      // Store token
      sessionStorage.setItem('auth_token', token);

      // Call the backend to establish session
      // Note: Auth routes are at /api, not /api/v1
      const authUrl = API_BASE_URL.replace('/api/v1', '/api');
      console.log(authUrl, API_KEY, token);
      const response = await fetch(`${authUrl}/auth/login/jwt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to establish session',
        };
      }

      // Store session ID
      if (data.sessionId) {
        sessionStorage.setItem('session_id', data.sessionId);
      }

      // Store user data
      if (data.user) {
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  async logout() {
    try {
      // Note: Auth routes are at /api, not /api/v1
      const authUrl = API_BASE_URL.replace('/api/v1', '/api');
      await fetch(`${authUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      sessionStorage.removeItem('session_id');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('session_id');
      localStorage.removeItem('auth_token');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  },
};

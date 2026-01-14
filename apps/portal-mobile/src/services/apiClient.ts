/**
 * API Client Instance for Mobile
 * Uses shared services for data fetching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PublicClientApplication from 'react-native-msal';
import { ENV } from '../config/env';
import { 
  ApiClient, 
  SitesService, 
  UsersService, 
  HelpChatService, 
  TrialsService, 
  ProtocolDocumentsService, 
  DelegationService, 
  DocumentQueryService,
  BillingService
} from '@protocolsync/shared-services';
import type { ApiResponse, HelpMessage, HelpMessageSource } from '@protocolsync/shared-services';

// Re-export types for convenience
export type { ApiResponse, HelpMessage, HelpMessageSource };

// Shared MSAL instance reference - will be set by AuthContext
let msalInstance: PublicClientApplication | null = null;

/**
 * Set the MSAL instance to use for getting tokens
 * Called by AuthContext after MSAL initialization
 */
export const setMsalInstance = (instance: PublicClientApplication) => {
  msalInstance = instance;
};

// Create API client instance
const apiClient = new ApiClient({
  baseUrl: ENV.API_URL,
  apiKey: ENV.API_KEY,
  getToken: async () => {
    try {
      console.log('[ApiClient.getToken] Called - checking for MSAL instance...');
      console.log('[ApiClient.getToken] MSAL instance exists:', !!msalInstance);
      
      // Get fresh token from MSAL (just like web portal does)
      if (msalInstance) {
        const accounts = await msalInstance.getAccounts();
        console.log('[ApiClient.getToken] Accounts found:', accounts?.length || 0);
        
        if (accounts && accounts.length > 0) {
          console.log('[ApiClient.getToken] Using account:', accounts[0].username);
          
          // Use custom API scope for Protocol Sync Portal
          const tokenResponse = await msalInstance.acquireTokenSilent({
            scopes: ['api://65b5eddd-4d68-421e-97a1-65399bfb4a48/access_as_user'],
            account: accounts[0],
          });
          
          console.log('[ApiClient.getToken] Token acquired successfully');
          console.log('[ApiClient.getToken] Token preview:', tokenResponse.accessToken.substring(0, 50) + '...');
          return tokenResponse.accessToken;
        } else {
          console.warn('[ApiClient.getToken] No accounts found');
        }
      } else {
        console.warn('[ApiClient.getToken] MSAL instance not set yet');
      }
      
      console.warn('[ApiClient.getToken] Returning empty token');
      return '';
    } catch (error) {
      console.error('[ApiClient.getToken] Error getting token:', error);
      return '';
    }
  },
  timeout: 30000,
});

// Export API client for direct use
export const api = apiClient;

// Export service instances
export const sitesService = new SitesService(apiClient);
export const usersService = new UsersService(apiClient);
export const helpChatService = new HelpChatService(apiClient);
export const trialsService = new TrialsService(apiClient);
export const protocolDocumentsService = new ProtocolDocumentsService(apiClient);
export const delegationService = new DelegationService(apiClient);
export const documentQueryService = new DocumentQueryService(apiClient);
export const billingService = new BillingService(apiClient);

// Session management
export const session = {
  async loginWithJWT(token: string): Promise<ApiResponse<any>> {
    try {
      console.log('[Session.loginWithJWT] Calling /user/profile...');
      console.log('[Session.loginWithJWT] API URL:', ENV.API_URL);
      console.log('[Session.loginWithJWT] Token preview:', token.substring(0, 50) + '...');
      console.log('[Session.loginWithJWT] API Key exists:', !!ENV.API_KEY);
      
      // Fetch user profile from backend (like web portal does)
      const response = await fetch(`${ENV.API_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': ENV.API_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Session.loginWithJWT] Response status:', response.status);
      
      const data = await response.json();
      console.log('[Session.loginWithJWT] Response data:', data);

      if (!response.ok) {
        console.error('[Session.loginWithJWT] Request failed:', data);
        return {
          success: false,
          error: data.error || data.message || 'Failed to fetch user profile',
        };
      }

      // Store user data
      if (data.data) {
        await AsyncStorage.setItem('user', JSON.stringify(data.data));
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

  async logout(): Promise<ApiResponse<any>> {
    try {
      await AsyncStorage.removeItem('session_id');
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  },
};

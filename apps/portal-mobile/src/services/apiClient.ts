/**
 * API Client Instance for Mobile
 * Uses shared services for data fetching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { ApiClient, SitesService, UsersService, HelpChatService, TrialsService, ProtocolDocumentsService, DelegationService } from '@protocolsync/shared-services';
import type { ApiResponse, HelpMessage, HelpMessageSource } from '@protocolsync/shared-services';

// Re-export types for convenience
export type { ApiResponse, HelpMessage, HelpMessageSource };

// Create API client instance
const apiClient = new ApiClient({
  baseUrl: ENV.API_URL,
  apiKey: ENV.API_KEY,
  getToken: async () => {
    const token = await AsyncStorage.getItem('access_token');
    return token || '';
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

// Session management
export const session = {
  async loginWithJWT(token: string): Promise<ApiResponse<any>> {
    try {
      // Fetch user profile from backend (like web portal does)
      const response = await fetch(`${ENV.API_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': ENV.API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
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

/**
 * API Client Instance for Mobile
 * Simple API client without shared services (for now)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

// Simple API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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

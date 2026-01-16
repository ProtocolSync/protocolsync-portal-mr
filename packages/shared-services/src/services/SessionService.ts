import type { ApiClient, ApiResponse } from '../api/ApiClient';
import type { User } from '@protocolsync/shared-types';
import { transformUserProfileResponse } from '../utils/userProfileTransformer';

/**
 * SessionService handles user session operations
 * - Fetching user profile from backend after MSAL authentication
 * - Logout operations
 *
 * Used by both web and mobile platforms
 */
export class SessionService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Fetch user profile from backend
   * Called after MSAL authentication to get user details from our database
   *
   * The backend validates the JWT token from MSAL and returns
   * the user's profile including company/site associations
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    const response = await this.apiClient.get<any>('/user/profile');

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch user profile'
      };
    }

    try {
      const user = transformUserProfileResponse(response.data);
      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transform user profile'
      };
    }
  }

  /**
   * Clear session on the backend
   * Called during logout to invalidate any server-side session
   *
   * Note: The primary logout is handled by MSAL. This is for
   * any additional backend cleanup if needed.
   */
  async logout(): Promise<ApiResponse<void>> {
    // Currently the backend doesn't have a logout endpoint
    // since sessions are stateless JWT-based.
    // This can be extended if backend logout is needed.
    return { success: true };
  }
}

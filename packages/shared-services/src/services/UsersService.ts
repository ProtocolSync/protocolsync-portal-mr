import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface CompanyUser {
  user_id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  job_title?: string;
  department?: string;
  phone?: string;
  created_at?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  role: string;
  job_title?: string;
  department?: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: string;
  status?: string;
  job_title?: string;
  department?: string;
  phone?: string;
}

export class UsersService {
  constructor(private apiClient: ApiClient) {}

  async getCompanyUsers(companyId: number | string): Promise<ApiResponse<CompanyUser[]>> {
    const response = await this.apiClient.get<any>(`/companies/${companyId}/users`);

    if (response.success && response.data !== undefined) {
      // Handle nested data structure from backend
      const data = response.data.data !== undefined ? response.data.data : response.data;
      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch company users',
    };
  }

  async createUser(companyId: number | string, userData: CreateUserData): Promise<ApiResponse<CompanyUser>> {
    return this.apiClient.post<CompanyUser>(`/companies/${companyId}/users`, userData);
  }

  async updateUser(
    companyId: number | string,
    userId: number | string,
    userData: UpdateUserData,
    currentUserId?: number
  ): Promise<ApiResponse<CompanyUser>> {
    let url = `/companies/${companyId}/users/${userId}`;
    if (currentUserId) {
      url += `?user_id=${currentUserId}`;
    }
    return this.apiClient.put<CompanyUser>(url, userData);
  }

  async deleteUser(
    companyId: number | string,
    userId: number | string,
    currentUserId?: number
  ): Promise<ApiResponse<any>> {
    let url = `/companies/${companyId}/users/${userId}`;
    if (currentUserId) {
      url += `?user_id=${currentUserId}`;
    }
    return this.apiClient.delete(url);
  }

  async updateUserStatus(
    companyId: number | string,
    userId: number | string,
    status: 'active' | 'inactive'
  ): Promise<ApiResponse<CompanyUser>> {
    return this.apiClient.put<CompanyUser>(`/companies/${companyId}/users/${userId}`, { status });
  }

  async resendInvitation(userId: number | string): Promise<ApiResponse<any>> {
    // Note: This endpoint doesn't use /v1 prefix based on web implementation
    return this.apiClient.post(`/users/${userId}/resend-invitation`, {});
  }
}

import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  protocol_number?: string;
  phase?: string;
  status: string;
  pi_name?: string;
  assigned_user_count: number;
  document_count?: number;
  created_at: string;
  site_id?: number;
  site_name?: string;
  company_id?: number;
}

export interface CreateTrialData {
  trial_number: string;
  trial_name: string;
  protocol_number?: string;
  phase?: string;
  status: string;
  site_id: number;
  created_by_user_id?: number;
}

export interface UpdateTrialData {
  trial_name?: string;
  protocol_number?: string;
  phase?: string;
  status?: string;
  pi_name?: string;
}

export class TrialsService {
  constructor(private apiClient: ApiClient) {}

  async getTrials(params?: {
    userId?: number | string;
    siteId?: number | string;
    companyId?: number | string;
    status?: string;
  }): Promise<ApiResponse<Trial[]>> {
    const queryParams = new URLSearchParams();
    
    if (params?.userId) {
      queryParams.append('user_id', params.userId.toString());
    }
    if (params?.siteId) {
      queryParams.append('site_id', params.siteId.toString());
    }
    if (params?.companyId) {
      queryParams.append('company_id', params.companyId.toString());
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }

    const url = `/trials${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.apiClient.get<any>(url);

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
      error: response.error || 'Failed to fetch trials',
    };
  }

  async getTrial(trialId: number | string): Promise<ApiResponse<Trial>> {
    const response = await this.apiClient.get<any>(`/trials/${trialId}`);

    if (response.success && response.data !== undefined) {
      // Handle nested data structure from backend
      const data = response.data.data !== undefined ? response.data.data : response.data;
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch trial',
    };
  }

  async createTrial(trialData: CreateTrialData): Promise<ApiResponse<Trial>> {
    const response = await this.apiClient.post<any>('/trials', trialData);

    if (response.success && response.data !== undefined) {
      const data = response.data.data !== undefined ? response.data.data : response.data;
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to create trial',
    };
  }

  async updateTrial(trialId: number | string, trialData: UpdateTrialData): Promise<ApiResponse<Trial>> {
    const response = await this.apiClient.put<any>(`/trials/${trialId}`, trialData);

    if (response.success && response.data !== undefined) {
      const data = response.data.data !== undefined ? response.data.data : response.data;
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to update trial',
    };
  }

  async deleteTrial(trialId: number | string): Promise<ApiResponse<void>> {
    return await this.apiClient.delete(`/trials/${trialId}`);
  }

  async assignUserToTrial(
    trialId: number | string,
    userId: number | string,
    trialRole: string
  ): Promise<ApiResponse<any>> {
    const response = await this.apiClient.post<any>(`/trials/${trialId}/users`, {
      user_id: userId,
      trial_role: trialRole,
    });

    if (response.success && response.data !== undefined) {
      const data = response.data.data !== undefined ? response.data.data : response.data;
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to assign user to trial',
    };
  }

  async removeUserFromTrial(
    trialId: number | string,
    userId: number | string
  ): Promise<ApiResponse<void>> {
    return await this.apiClient.delete(`/trials/${trialId}/users/${userId}`);
  }

  async getTrialsBySite(siteId: number | string): Promise<ApiResponse<Trial[]>> {
    const response = await this.apiClient.get<any>(`/sites/${siteId}/trials`);

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
      error: response.error || 'Failed to fetch trials for site',
    };
  }
}

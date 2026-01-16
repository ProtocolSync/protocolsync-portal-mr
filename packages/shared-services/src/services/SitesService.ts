import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
  institution_name: string;
  address_line1?: string;
  city: string;
  state_province: string;
  postal_code?: string;
  country: string;
  status: 'active' | 'inactive';
  principal_investigator?: string;
  company_id?: number;
  active_users?: number;
  active_trials?: number;
  site_administrator_count?: number;
  site_users_count?: number;
  created_at?: string;
  record_hash?: string;
}

export interface CreateSiteData {
  site_number: string;
  site_name: string;
  institution_name: string;
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  created_by_user_id?: number;
}

export interface UpdateSiteStatusData {
  status: 'active' | 'inactive';
  reason: string;
  performed_by_user_id: number;
}

export interface AddSiteAdministratorData {
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_job_title: string;
  assigned_by_user_id: number;
  requester_role: string;
}

export interface ProvisionSiteUserData {
  email: string;
  name: string;
  job_title?: string;
  provisioned_by_user_id: number;
}

export interface SiteAdministrator {
  user_id: number;
  name: string;
  email: string;
  job_title: string;
  department?: string;
  professional_credentials?: string;
  phone?: string;
  site_id: number;
  site_number: string;
  site_name: string;
  institution_name: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
  last_login_at?: string;
  created_at?: string;
  record_hash?: string;
}

export class SitesService {
  constructor(private apiClient: ApiClient) {}

  async getSites(companyId: number | string): Promise<ApiResponse<Site[]>> {
    const response = await this.apiClient.get<any>(`/sites?company_id=${companyId}`);

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
      error: response.error || 'Failed to fetch sites',
    };
  }

  async getSite(siteId: number | string): Promise<ApiResponse<Site>> {
    const response = await this.apiClient.get<any>(`/sites/${siteId}`);

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
      error: response.error || 'Failed to fetch site',
    };
  }

  async createSite(companyId: number | string, siteData: CreateSiteData): Promise<ApiResponse<Site>> {
    return this.apiClient.post<Site>(`/companies/${companyId}/sites`, siteData);
  }

  async updateSiteStatus(siteId: number | string, statusData: UpdateSiteStatusData): Promise<ApiResponse<any>> {
    return this.apiClient.patch(`/sites/${siteId}/status`, statusData);
  }

  async deleteSite(companyId: number | string, siteId: number | string, userId?: number): Promise<ApiResponse<any>> {
    let url = `/companies/${companyId}/sites/${siteId}`;
    if (userId) {
      url += `?user_id=${userId}`;
    }
    return this.apiClient.delete(url);
  }

  async getSiteUsers(siteId: number | string): Promise<ApiResponse<any[]>> {
    const response = await this.apiClient.get<any>(`/sites/${siteId}/users`);

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
      error: response.error || 'Failed to fetch site users',
    };
  }

  async getSiteAdministrators(companyId: number | string): Promise<ApiResponse<SiteAdministrator[]>> {
    const response = await this.apiClient.get<any>(`/companies/${companyId}/administrators`);

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
      error: response.error || 'Failed to fetch site administrators',
    };
  }

  async addSiteAdministrator(
    companyId: number | string,
    siteId: number | string,
    adminData: AddSiteAdministratorData
  ): Promise<ApiResponse<any>> {
    return this.apiClient.post(`/companies/${companyId}/sites/${siteId}/administrator`, adminData);
  }

  async getSitesByCompany(companyId: number | string): Promise<ApiResponse<Site[]>> {
    const response = await this.apiClient.get<any>(`/companies/${companyId}/sites`);

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
      error: response.error || 'Failed to fetch sites for company',
    };
  }

  async provisionSiteUser(
    siteId: number | string,
    userData: ProvisionSiteUserData
  ): Promise<ApiResponse<any>> {
    const response = await this.apiClient.post<any>(`/sites/${siteId}/users/provision`, userData);

    if (response.success && response.data !== undefined) {
      const data = response.data.data !== undefined ? response.data.data : response.data;
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to provision site user',
    };
  }
}

/**
 * Delegation Service
 * Handles API calls for delegation management and report generation
 */

import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface DelegationReportConfig {
  reportTitle: string;
  scopeFilter: 'current' | 'all' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  protocolId?: string;
  userFilter?: string;
  includeAuditTrail: boolean;
  reportFormat: 'pdf-signed' | 'pdf' | 'csv';
}

export interface CreateDelegationData {
  delegated_by_user_id: string;
  delegated_user_id: string;
  protocol_version_id: number;
  delegated_job_title: string;
  task_description: string;
  effective_start_date: string;
  effective_end_date: string;
  training_required: boolean;
}

export interface ReportGenerationResponse {
  report_id: string;
  status: string;
  message: string;
}

export interface ReportStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
  progress?: number;
}

export class DelegationService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get delegations for a user
   */
  async getDelegations(userId: string): Promise<ApiResponse<any>> {
    try {
      console.log('[DelegationService] Getting delegations for user:', userId);

      const response = await this.apiClient.get(`/compliance/delegations?user_id=${userId}`);

      if (response.success) {
        // Unwrap nested data structure if it exists
        const data = (response.data as any).data !== undefined ? (response.data as any).data : response.data;
        return {
          success: true,
          data,
        };
      }

      return {
        success: false,
        error: 'Failed to get delegations',
      };
    } catch (error) {
      console.error('[DelegationService] Error getting delegations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get delegations',
      };
    }
  }

  /**
   * Accept or decline a delegation
   */
  async signDelegation(
    delegationId: number,
    userId: string,
    action: 'accept' | 'decline',
    printedName: string
  ): Promise<ApiResponse<any>> {
    try {
      console.log('[DelegationService] Signing delegation:', delegationId, action);

      const response = await this.apiClient.post(`/compliance/delegation/${delegationId}/sign`, {
        user_id: parseInt(userId, 10), // Convert to number
        action,
        printed_name: printedName,
      });

      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || `Failed to ${action} delegation`,
      };
    } catch (error) {
      console.error('[DelegationService] Error signing delegation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to ${action} delegation`,
      };
    }
  }

  /**
   * Create a new delegation assignment
   */
  async createDelegation(data: CreateDelegationData): Promise<ApiResponse<any>> {
    try {
      console.log('[DelegationService] Creating delegation:', data);

      const response = await this.apiClient.post('/compliance/delegation', data);

      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Failed to create delegation',
      };
    } catch (error) {
      console.error('[DelegationService] Error creating delegation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create delegation',
      };
    }
  }

  /**
   * Revoke a delegation
   */
  async revokeDelegation(
    delegationId: string,
    revokedByUserId: string,
    revocationReason?: string
  ): Promise<ApiResponse<any>> {
    try {
      console.log('[DelegationService] Revoking delegation:', delegationId);

      const response = await this.apiClient.put(`/compliance/delegation/${delegationId}/revoke`, {
        revoked_by_user_id: revokedByUserId,
        revocation_reason: revocationReason || 'Revoked by authorized personnel',
      });

      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Failed to revoke delegation',
      };
    } catch (error) {
      console.error('[DelegationService] Error revoking delegation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke delegation',
      };
    }
  }

  /**
   * Generate a delegation log report
   */
  async generateReport(
    userId: string,
    config: DelegationReportConfig
  ): Promise<ApiResponse<ReportGenerationResponse>> {
    try {
      const payload = {
        userId,
        reportTitle: config.reportTitle || `Delegation Log - ${new Date().toLocaleDateString()}`,
        scopeFilter: config.scopeFilter,
        dateFrom: config.dateFrom || null,
        dateTo: config.dateTo || null,
        protocolId: config.protocolId || null,
        userFilter: config.userFilter || null,
        includeAuditTrail: config.includeAuditTrail,
        reportFormat: config.reportFormat,
      };

      console.log('[DelegationReportsService] Generating report with payload:', payload);

      const response = await this.apiClient.post('/reports/delegation-log', payload);

      if (response.success && response.data) {
        return {
          success: true,
          data: (response.data as any).data || response.data,
        };
      }

      return {
        success: false,
        error: 'Failed to start report generation',
      };
    } catch (error) {
      console.error('[DelegationReportsService] Error generating report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      };
    }
  }

  /**
   * Check the status of a report generation
   */
  async getReportStatus(reportId: string): Promise<ApiResponse<ReportStatusResponse>> {
    try {
      const response = await this.apiClient.get(`/reports/status/${reportId}`);

      if (response.success && response.data) {
        const data = (response.data as any).data || response.data;
        return {
          success: true,
          data: {
            status: data.status,
            download_url: data.download_url || data.downloadUrl,
            error: data.error,
            progress: data.progress,
          },
        };
      }

      return {
        success: false,
        error: 'Failed to check report status',
      };
    } catch (error) {
      console.error('[DelegationReportsService] Error checking report status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check report status',
      };
    }
  }

  /**
   * Poll for report completion
   * @param reportId - The report ID to poll
   * @param onProgress - Callback for progress updates
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   * @param intervalMs - Polling interval in milliseconds (default: 1000)
   */
  async pollReportStatus(
    reportId: string,
    onProgress?: (status: ReportStatusResponse) => void,
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<ApiResponse<string>> {
    let attempts = 0;

    return new Promise((resolve) => {
      const checkStatus = async () => {
        try {
          attempts++;

          const response = await this.getReportStatus(reportId);

          if (!response.success || !response.data) {
            if (attempts >= maxAttempts) {
              resolve({
                success: false,
                error: 'Report generation timed out',
              });
              return;
            }
            setTimeout(checkStatus, intervalMs);
            return;
          }

          const status = response.data;

          // Call progress callback if provided
          if (onProgress) {
            onProgress(status);
          }

          console.log(`[DelegationReportsService] Poll attempt ${attempts}: status=${status.status}`);

          if (status.status === 'completed') {
            // Return reportId instead of download_url so caller can use download endpoint
            resolve({
              success: true,
              data: reportId,
            });
          } else if (status.status === 'failed') {
            resolve({
              success: false,
              error: status.error || 'Report generation failed',
            });
          } else if (attempts >= maxAttempts) {
            resolve({
              success: false,
              error: 'Report generation timed out',
            });
          } else {
            // Still processing, check again
            setTimeout(checkStatus, intervalMs);
          }
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to poll report status',
          });
        }
      };

      checkStatus();
    });
  }

  /**
   * Get the download URL for a completed report
   * @param reportId - The report ID
   * @returns The download URL
   */
  getDownloadUrl(reportId: string): string {
    return `${this.apiClient.getBaseUrl()}/reports/download/${reportId}`;
  }
}

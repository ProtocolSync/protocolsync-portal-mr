// TypeScript interfaces for report generation

// Base filter interface
export interface BaseReportFilter {
  reportTitle: string;
  includeAuditTrail?: boolean;
  reportFormat?: 'pdf-signed' | 'pdf' | 'csv';
}

// System Access Report Filter
export interface SystemAccessFilter extends BaseReportFilter {
  dateFrom?: string;
  dateTo?: string;
  actionTypeFilter?: 'all' | 'user_created' | 'user_activated' | 'user_deactivated' | 'access_granted' | 'access_revoked';
  userFilter?: string;
}

// Site/Trial Master Report Filter
export interface SiteTrialMasterFilter extends BaseReportFilter {
  siteStatusFilter?: 'all' | 'active' | 'inactive';
  includeTrialDetails?: boolean;
  trialStatusFilter?: 'all' | 'active' | 'paused' | 'completed' | 'closed';
}

// Permission Change Log Filter
export interface PermissionChangeFilter extends BaseReportFilter {
  dateFrom?: string;
  dateTo?: string;
  changeTypeFilter?: 'all' | 'trial_permission' | 'site_permission';
  actionFilter?: 'all' | 'assigned' | 'removed' | 'role_changed';
  userFilter?: string;
}

// Deactivation Report Filter
export interface DeactivationFilter extends BaseReportFilter {
  dateFrom?: string;
  dateTo?: string;
  includeAll?: boolean;
  statusFilter?: 'all' | 'deactivated' | 'inactive';
  reasonFilter?: string;
}

// Report generation response
export interface ReportGenerationResponse {
  success: boolean;
  message: string;
  data: {
    report_id: string;
    status: 'generating' | 'completed' | 'failed';
    check_status_url: string;
    download_url: string;
  };
}

// Report status response
export interface ReportStatusResponse {
  success: boolean;
  data: {
    report_id: string;
    status: 'generating' | 'completed' | 'failed';
    report_title: string;
    file_size_bytes?: number;
    page_count?: number;
    completed_at?: string;
    error_message?: string;
    created_at: string;
  };
}

// Report type enum
export type ReportType = 'system-access' | 'site-trial-master' | 'permission-change' | 'deactivation' | 'delegation-log';

// Union type for all filters
export type ReportFilter = SystemAccessFilter | SiteTrialMasterFilter | PermissionChangeFilter | DeactivationFilter;

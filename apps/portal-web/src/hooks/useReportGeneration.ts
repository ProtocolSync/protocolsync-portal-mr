import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNotify } from 'react-admin';
import type { ReportType, ReportGenerationResponse, ReportStatusResponse } from '../types/reports';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useReportGeneration = () => {
  const { instance } = useMsal();
  const notify = useNotify();
  const [isGenerating, setIsGenerating] = useState(false);

  const getAuthToken = async () => {
    const accounts = instance.getAllAccounts();
    if (accounts.length === 0) return '';
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      return '';
    }
  };

  const generateReport = async (
    reportType: ReportType,
    userId: number,
    filterCriteria: any
  ): Promise<string | null> => {
    try {
      setIsGenerating(true);
      const token = await getAuthToken();

      const endpointMap: Record<ReportType, string> = {
        'delegation-log': '/reports/delegation-log',
        'system-access': '/reports/system-access',
        'site-trial-master': '/reports/site-trial-master',
        'permission-change': '/reports/permission-change',
        'deactivation': '/reports/deactivation'
      };

      const endpoint = endpointMap[reportType];

      const payload = {
        userId,
        ...filterCriteria
      };

      console.log(`[Generate Report] ${reportType} Payload:`, payload);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start report generation');
      }

      const data: ReportGenerationResponse = await response.json();
      console.log('[Generate Report] Response:', data);

      notify('Report generation started. Download will begin shortly...', { type: 'info' });

      // Start polling
      const reportId = data.data.report_id;
      pollReportStatus(reportId, token, filterCriteria.reportTitle || 'report');

      return reportId;

    } catch (error) {
      console.error('[Generate Report] Error:', error);
      notify(error instanceof Error ? error.message : 'Failed to generate report', { type: 'error' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const pollReportStatus = async (reportId: string, token: string, reportTitle: string) => {
    const maxAttempts = 60; // 60 seconds timeout
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;

        const response = await fetch(`${API_BASE_URL}/reports/status/${reportId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': import.meta.env.VITE_API_KEY
          }
        });

        if (!response.ok) throw new Error('Failed to check report status');

        const data: ReportStatusResponse = await response.json();
        const status = data.data.status;

        console.log(`[Poll Report] Attempt ${attempts}: ${status}`);

        if (status === 'completed') {
          notify('Report generated successfully! Downloading...', { type: 'success' });
          // Trigger download
          await downloadReport(reportId, token, reportTitle);
        } else if (status === 'failed') {
          notify('Report generation failed: ' + (data.data.error_message || 'Unknown error'), { type: 'error' });
        } else if (attempts < maxAttempts) {
          // Still generating, check again in 1 second
          setTimeout(checkStatus, 1000);
        } else {
          notify('Report generation is taking longer than expected. Please check back later.', { type: 'warning' });
        }
      } catch (error) {
        console.error('[Poll Report] Error:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000);
        }
      }
    };

    checkStatus();
  };

  const downloadReport = async (reportId: string, token: string, reportTitle: string) => {
    try {
      const downloadResponse = await fetch(`${API_BASE_URL}/reports/download/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': import.meta.env.VITE_API_KEY
        }
      });

      if (!downloadResponse.ok) throw new Error('Failed to download report');

      const blob = await downloadResponse.blob();

      // Try to get filename from Content-Disposition header
      let filename = reportTitle?.trim()
        ? reportTitle.trim().replace(/[^a-zA-Z0-9-_\.]/g, '_') + '.pdf'
        : `${reportId}.pdf`;

      const disposition = downloadResponse.headers.get('Content-Disposition');
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      notify('Failed to download report', { type: 'error' });
    }
  };

  return {
    generateReport,
    pollReportStatus,
    downloadReport,
    isGenerating
  };
};

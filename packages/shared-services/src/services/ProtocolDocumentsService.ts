/**
 * Protocol Documents Service
 * Handles API calls for protocol document management
 */

import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface ProtocolDocument {
  id: string;
  document_id?: string;
  documentName: string;
  currentVersion: string;
  totalVersions: number;
  status: string;
  document_type?: string;
  original_filename?: string;
  document_version?: string;
  upload_date?: string;
  created_at?: string;
}

export interface ProtocolVersion {
  id: string;
  versionNumber: string;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
  fileName: string;
  fileUrl?: string;
  recordHash?: string;
}

export interface UploadProtocolData {
  document: File | Blob;
  document_type: string;
  document_version: string;
  site_id: string;
  trial_id: string;
  user_id?: string;
}

export class ProtocolDocumentsService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get all protocol documents filtered by site_id and trial_id
   * @param siteId - Optional site ID to filter documents
   * @param trialId - Optional trial ID to filter documents
   */
  async getProtocolDocuments(siteId?: string, trialId?: string): Promise<ApiResponse<ProtocolDocument[]>> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (siteId) {
        params.append('site_id', siteId);
      }
      if (trialId) {
        params.append('trial_id', trialId);
      }
      
      const endpoint = `/documents?${params.toString()}`;
      console.log('[ProtocolDocumentsService] Fetching protocol documents from:', endpoint);
      
      const response = await this.apiClient.get(endpoint);

      console.log('[ProtocolDocumentsService] Raw API response:', response);
      console.log('[ProtocolDocumentsService] Response success:', response.success);
      console.log('[ProtocolDocumentsService] Response data type:', typeof response.data);
      console.log('[ProtocolDocumentsService] Response data:', response.data);

      if (response.success && response.data) {
        const rawData = (response.data as any).data || response.data;
        console.log('[ProtocolDocumentsService] Raw data after extraction:', rawData);
        console.log('[ProtocolDocumentsService] Raw data length:', Array.isArray(rawData) ? rawData.length : 'not an array');
        
        // Group documents by document_type to show only latest version per protocol
        const grouped = rawData.reduce((acc: any, doc: any) => {
          const docName = doc.document_type || doc.document_name || doc.display_name || doc.original_filename || 'Untitled';
          
          if (!acc[docName] || 
              new Date(doc.upload_date || doc.date_approved || doc.created_at) > new Date(acc[docName].upload_date || acc[docName].date_approved || acc[docName].created_at)) {
            acc[docName] = doc;
          }
          return acc;
        }, {});

        console.log('[ProtocolDocumentsService] Grouped documents:', Object.keys(grouped).length, 'unique types');

        const transformedDocs = Object.values(grouped).map((doc: any) => {
          const docName = doc.document_type || doc.document_name || doc.display_name || doc.original_filename || 'Untitled';
          const versionCount = rawData.filter((d: any) => 
            (d.document_type || d.document_name || d.display_name || d.original_filename || 'Untitled') === docName
          ).length;
          
          return {
            id: doc.document_id || doc.version_id || doc.id,
            documentName: docName,
            currentVersion: doc.document_version || doc.version_number || 'N/A',
            totalVersions: versionCount,
            status: doc.status || doc.current_status || 'uploaded',
            document_type: doc.document_type,
            original_filename: doc.original_filename,
            document_version: doc.document_version || doc.version_number,
            upload_date: doc.upload_date || doc.date_approved,
            created_at: doc.created_at,
          };
        });

        console.log('[ProtocolDocumentsService] Transformed documents:', transformedDocs.length);
        console.log('[ProtocolDocumentsService] Transformed documents sample:', transformedDocs[0]);

        return {
          success: true,
          data: transformedDocs,
        };
      }

      console.warn('[ProtocolDocumentsService] Response not successful or no data');
      return {
        success: false,
        error: 'Failed to fetch protocol documents',
      };
    } catch (error) {
      console.error('[ProtocolDocumentsService] Error fetching protocol documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch protocol documents',
      };
    }
  }

  /**
   * Get all versions of a specific protocol document
   */
  async getProtocolVersions(documentId: string): Promise<ApiResponse<ProtocolVersion[]>> {
    try {
      const response = await this.apiClient.get(`/document/${documentId}`);

      if (response.success && response.data) {
        const doc = (response.data as any).data || response.data;
        const docName = doc.document_type || doc.original_filename || 'Untitled';

        // Fetch all documents to get versions
        const allDocsResponse = await this.apiClient.get('/documents?limit=100');
        
        if (allDocsResponse.success && allDocsResponse.data) {
          const allDocs = (allDocsResponse.data as any).data || (allDocsResponse.data as any).documents || [];
          
          const getBaseName = (name: string) => {
            return name
              .replace(/\s*[vV]?\d+\.\d+.*$/, '')
              .replace(/\s*\(.*?\)\s*/, '')
              .trim();
          };

          const targetBaseName = getBaseName(docName);

          const sameTypeVersions = allDocs.filter((d: any) => {
            const currentDocName = d.document_type || d.original_filename || 'Untitled';
            const currentBaseName = getBaseName(currentDocName);
            return currentBaseName === targetBaseName;
          });

          const transformedVersions = sameTypeVersions
            .map((v: any) => ({
              id: v.document_id || v.id,
              versionNumber: v.document_version || 'N/A',
              status: v.status || 'uploaded',
              uploadedAt: v.upload_date || v.created_at || new Date().toISOString(),
              uploadedBy: v.uploaded_by_name || v.uploaded_by_email || 'System',
              fileName: v.original_filename || 'document.pdf',
              fileUrl: v.blob_url || v.file_url,
              recordHash: v.record_hash,
            }))
            .sort((a: ProtocolVersion, b: ProtocolVersion) =>
              new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );

          return {
            success: true,
            data: transformedVersions,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to fetch protocol versions',
      };
    } catch (error) {
      console.error('Error fetching protocol versions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch protocol versions',
      };
    }
  }

  /**
   * Upload a new protocol document
   * Note: This method uses fetch directly instead of ApiClient because FormData
   * needs special handling that the ApiClient doesn't support yet
   */
  async uploadProtocol(data: UploadProtocolData): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('document', data.document);
      formData.append('document_type', data.document_type);
      formData.append('document_version', data.document_version);
      formData.append('site_id', data.site_id);
      formData.append('trial_id', data.trial_id);
      
      if (data.user_id) {
        formData.append('user_id', data.user_id);
      }

      // Get token and build headers manually since we need FormData support
      const token = await (this.apiClient as any).getToken();
      const apiKey = (this.apiClient as any).apiKey;
      const baseUrl = (this.apiClient as any).baseUrl;

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      const response = await fetch(`${baseUrl}/document/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Upload failed',
        };
      }

      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      console.error('Error uploading protocol:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload protocol',
      };
    }
  }

  /**
   * Update protocol version status
   */
  async updateVersionStatus(versionId: string, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.put(`/documents/${versionId}/status`, {
        status,
      });

      return response;
    } catch (error) {
      console.error('Error updating version status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update version status',
      };
    }
  }
}

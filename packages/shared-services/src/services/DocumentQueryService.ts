import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface DocumentQuerySource {
  document?: string;
  page?: number;
  section?: string | null;
  chunk_id?: number;
  similarity?: number;
}

export interface QueryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentQuerySource[];
  isLoading?: boolean;
}

export interface SendQueryRequest {
  query: string;
  userId: string;
  documentId: string;
  documentName?: string;
  context?: Record<string, unknown>;
}

export interface SendQueryResponse {
  success: boolean;
  answer: string;
  sources?: DocumentQuerySource[];
  error?: string;
  message?: string;
}

export class DocumentQueryService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Send a query about a specific document
   */
  async sendQuery(request: SendQueryRequest): Promise<ApiResponse<SendQueryResponse>> {
    try {
      const requestBody: any = {
        query: request.query,
        userId: request.userId,
        documentId: request.documentId,
      };

      if (request.documentName) {
        requestBody.documentName = request.documentName;
      }

      if (request.context) {
        requestBody.context = request.context;
      }

      const response = await this.apiClient.post<any>('/query', requestBody);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            success: response.data.success ?? true,
            answer: response.data.answer || response.data.message || '',
            sources: response.data.sources,
          },
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to query document',
      };
    } catch (error) {
      console.error('[DocumentQueryService] Error querying document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query document',
      };
    }
  }
}

import type { ApiRequest, ApiResponse } from '../types';

export class ChatApiService {
  private apiEndpoint: string;
  private apiKey?: string;
  private authToken?: string;

  constructor(apiEndpoint: string, apiKey?: string, authToken?: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
    this.authToken = authToken;
  }

  async sendMessage(
    query: string,
    userId?: string,
    documentId?: string,
    documentName?: string,
    context?: Record<string, unknown>
  ): Promise<ApiResponse> {
    try {
      const request: ApiRequest = {
        query,
        ...(userId && { userId }),
        ...(documentId && { documentId }),
        ...(documentName && { documentName }),
        context,
      };
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      } else if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      const apiKey = import.meta.env.VITE_API_KEY;
      headers['X-API-Key'] = apiKey;

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        answer: data.answer || data.message || '',
      };
    } catch (error) {
      console.error('Error sending message to API:', error);
      return {
        success: false,
        answer: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

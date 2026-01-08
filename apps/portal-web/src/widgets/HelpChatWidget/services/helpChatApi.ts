import type {
  HelpChatApiResponse,
  HelpChatHistoryResponse,
  EscalationRequest,
  EscalationResponse
} from '../types';

export class HelpChatApiService {
  private apiBaseUrl: string;
  private authToken: string;
  private apiKey: string;

  constructor(apiBaseUrl: string, authToken: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.apiKey = import.meta.env.VITE_API_KEY || '';
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Send a message to the help chat
   * @param message - User's message
   * @param userId - User ID
   * @param siteId - Site ID (optional)
   * @param conversationId - Optional existing conversation ID
   * @param sessionToken - Optional session token for persistence
   */
  async sendMessage(
    message: string,
    userId: number,
    siteId?: number,
    conversationId?: number,
    sessionToken?: string
  ): Promise<HelpChatApiResponse> {
    try {
      const requestBody: {
        message: string;
        user_id: number;
        site_id?: number;
        conversation_id?: number;
        session_token?: string;
      } = {
        message,
        user_id: userId
      };

      if (siteId) {
        requestBody.site_id = siteId;
      }

      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      if (sessionToken) {
        requestBody.session_token = sessionToken;
      }

      const response = await fetch(`${this.apiBaseUrl}/help/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.statusText}`);
      }

      const data: HelpChatApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending help chat message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Retrieve conversation history
   * @param conversationId - Conversation ID
   * @param userId - User ID
   * @param limit - Max messages to retrieve
   */
  async getConversationHistory(
    conversationId: number,
    userId: number,
    limit = 50
  ): Promise<HelpChatHistoryResponse> {
    try {
      const params = new URLSearchParams({
        conversation_id: conversationId.toString(),
        user_id: userId.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/help/chat/history?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.statusText}`);
      }

      const data: HelpChatHistoryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error retrieving conversation history:', error);
      return {
        success: false,
        messages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Escalate conversation to support
   * @param request - Escalation request with conversation_id, subject, additional_info
   */
  async escalateToSupport(request: EscalationRequest): Promise<EscalationResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/help/chat/escalate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.statusText}`);
      }

      const data: EscalationResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error escalating to support:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Clear conversation (archive)
   * @param conversationId - Conversation ID
   * @param userId - User ID
   */
  async clearConversation(conversationId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({
        user_id: userId.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/help/chat/${conversationId}?${params}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

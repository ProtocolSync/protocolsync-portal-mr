import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface HelpMessageSource {
  source_id: number;
  source_type: 'quick_start_guide' | 'protocol' | 'help_doc';
  document_name?: string;
  document_version?: string;
  page_number?: number;
  section_title?: string;
  similarity_score: number;
}

export interface HelpMessage {
  message_id?: number;
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  timestamp?: Date;
  sources?: HelpMessageSource[];
  token_count?: number;
  response_time_ms?: number;
  isLoading?: boolean;
}

export interface SendMessageRequest {
  message: string;
  user_id: number;
  site_id?: number;
  conversation_id?: number;
  session_token?: string;
}

export interface SendMessageResponse {
  success: boolean;
  conversation_id?: number;
  message?: {
    message_id: number;
    role: 'assistant';
    content: string;
    sources: HelpMessageSource[];
    token_count: number;
    response_time_ms: number;
  };
  error?: string;
}

export interface ConversationHistoryResponse {
  success: boolean;
  messages: Array<{
    message_id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    token_count?: number;
    sources?: HelpMessageSource[];
  }>;
  error?: string;
}

export interface EscalationRequest {
  conversation_id: number;
  user_id: number;
  subject: string;
  additional_info?: string;
}

export interface EscalationResponse {
  success: boolean;
  ticket_id?: number;
  message?: string;
  error?: string;
}

export class HelpChatService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Send a message to the help chat
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> {
    const requestBody: any = {
      message: request.message,
      user_id: request.user_id,
    };

    if (request.site_id !== undefined) {
      requestBody.site_id = request.site_id;
    }

    if (request.conversation_id !== undefined) {
      requestBody.conversation_id = request.conversation_id;
    }

    if (request.session_token !== undefined) {
      requestBody.session_token = request.session_token;
    }

    const response = await this.apiClient.post<any>('/help/chat', requestBody);

    if (response.success && response.data !== undefined) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to send message',
    };
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(
    conversationId: number,
    userId: number,
    limit = 50
  ): Promise<ApiResponse<ConversationHistoryResponse>> {
    const params = new URLSearchParams({
      conversation_id: conversationId.toString(),
      user_id: userId.toString(),
      limit: limit.toString(),
    });

    const response = await this.apiClient.get<any>(`/help/chat/history?${params}`);

    if (response.success && response.data !== undefined) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to retrieve conversation history',
    };
  }

  /**
   * Escalate conversation to support
   */
  async escalateToSupport(request: EscalationRequest): Promise<ApiResponse<EscalationResponse>> {
    const response = await this.apiClient.post<any>('/help/chat/escalate', request);

    if (response.success && response.data !== undefined) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to escalate to support',
    };
  }

  /**
   * Clear (archive) conversation
   */
  async clearConversation(conversationId: number, userId: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      user_id: userId.toString(),
    });

    const response = await this.apiClient.delete(`/help/chat/${conversationId}?${params}`);

    return response;
  }
}

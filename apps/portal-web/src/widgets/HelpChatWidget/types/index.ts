export interface HelpMessage {
  message_id?: number;
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: HelpMessageSource[];
  token_count?: number;
  response_time_ms?: number;
}

export interface HelpMessageSource {
  source_id: number;
  source_type: 'quick_start_guide' | 'protocol' | 'help_doc';
  document_name?: string;
  document_version?: string;
  page_number?: number;
  section_title?: string;
  similarity_score: number;
}

export interface HelpChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
  apiBaseUrl: string;
  userId: number;
  siteId?: number;
  containerClassName?: string;
  theme?: 'light' | 'dark';
}

export interface HelpChatApiResponse {
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

export interface HelpChatHistoryResponse {
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

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatWidgetProps {
  apiEndpoint: string;
  apiKey?: string;
  authToken?: string;
  userId?: string;
  documentId?: string;
  documentName?: string;
  recordHash?: string;
  placeholder?: string;
  welcomeMessage?: string;
  containerClassName?: string;
  theme?: 'light' | 'dark';
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface ApiResponse {
  success: boolean;
  answer: string;
  error?: string;
}

export interface ApiRequest {
  query: string;
  userId?: string;
  documentId?: string;
  documentName?: string;
  context?: Record<string, unknown>;
}

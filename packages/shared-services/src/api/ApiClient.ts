export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  getToken: () => Promise<string>;
  getSessionId?: () => Promise<string | null>;
  onUnauthorized?: () => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private getToken: () => Promise<string>;
  private getSessionId?: () => Promise<string | null>;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.getToken = config.getToken;
    this.getSessionId = config.getSessionId;
    this.onUnauthorized = config.onUnauthorized;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async request<T>(endpoint: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const token = await this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Add API key if available
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      // Add session ID if available
      if (this.getSessionId) {
        const sessionId = await this.getSessionId();
        if (sessionId) {
          headers['X-Session-Id'] = sessionId;
        }
      }

      // Merge with custom headers
      if (init?.headers) {
        Object.entries(init.headers as Record<string, string>).forEach(([key, value]) => {
          headers[key] = value;
        });
      }

      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle unauthorized
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      // Handle errors
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          data,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

/**
 * API Service
 * Centralized API client with authentication and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export interface ApiRequestOptions extends RequestInit {
  includeApiKey?: boolean;
  includeAuth?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(options: ApiRequestOptions = {}): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key if available and not explicitly disabled
  if (options.includeApiKey !== false && API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  // Add Bearer token if available and requested
  if (options.includeAuth !== false) {
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add session ID if available
  const sessionId = sessionStorage.getItem('session_id') || localStorage.getItem('session_id');
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  return headers;
}

/**
 * Make an API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`;

    const headers = getAuthHeaders(options);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Parse response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
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
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Upload file with multipart/form-data
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const headers = getAuthHeaders(options);
  
  // Remove Content-Type header to let browser set it with boundary
  delete (headers as any)['Content-Type'];

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });

    const data = await response.json();

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
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Session management
 */
export const session = {
  /**
   * Login and create session
   */
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    const response = await apiPost('/auth/login', { email, password }, { 
      includeApiKey: true,
      includeAuth: false 
    });
    
    if (response.success && response.data?.sessionId) {
      sessionStorage.setItem('session_id', response.data.sessionId);
      if (response.data.user) {
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response;
  },

  /**
   * Login with JWT token
   */
  async loginWithJWT(token: string): Promise<ApiResponse<any>> {
    sessionStorage.setItem('auth_token', token);
    
    const response = await apiPost('/auth/login/jwt', {}, {
      includeApiKey: true,
      includeAuth: true
    });
    
    if (response.success && response.data?.sessionId) {
      sessionStorage.setItem('session_id', response.data.sessionId);
      if (response.data.user) {
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response;
  },

  /**
   * Logout and destroy session
   */
  async logout(): Promise<ApiResponse<any>> {
    const response = await apiPost('/auth/logout', {}, {
      includeApiKey: true
    });
    
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    
    return response;
  },

  /**
   * Check session status
   */
  async check(): Promise<ApiResponse<any>> {
    return apiGet('/auth/session', {
      includeApiKey: true
    });
  },
};

/**
 * Verify API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return !!API_KEY;
}

/**
 * Get API configuration info
 */
export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    hasApiKey: !!API_KEY,
  };
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  upload: apiUpload,
  request: apiRequest,
  session,
  isApiKeyConfigured,
  getApiConfig,
};

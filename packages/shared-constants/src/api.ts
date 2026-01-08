export const API_CONFIG = {
  VERSION: 'v1',
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  SITES: {
    LIST: '/sites',
    CREATE: '/sites',
    GET: (id: string) => `/sites/${id}`,
    UPDATE: (id: string) => `/sites/${id}`,
    DELETE: (id: string) => `/sites/${id}`,
  },
  SITE_ADMINS: {
    LIST: '/site-administrators',
    CREATE: '/site-administrators',
    GET: (id: string) => `/site-administrators/${id}`,
    UPDATE: (id: string) => `/site-administrators/${id}`,
    DELETE: (id: string) => `/site-administrators/${id}`,
  },
  SITE_USERS: {
    LIST: '/site-users',
    CREATE: '/site-users',
    GET: (id: string) => `/site-users/${id}`,
    UPDATE: (id: string) => `/site-users/${id}`,
    DELETE: (id: string) => `/site-users/${id}`,
  },
  TRIALS: {
    LIST: '/trials',
    CREATE: '/trials',
    GET: (id: string) => `/trials/${id}`,
    UPDATE: (id: string) => `/trials/${id}`,
    DELETE: (id: string) => `/trials/${id}`,
  },
  PROTOCOLS: {
    LIST: '/protocols',
    GET: (id: string) => `/protocols/${id}`,
    UPLOAD: '/protocols/upload',
  },
  REPORTS: {
    GENERATE: '/reports/generate',
    LIST: '/reports',
  },
};

export const getApiBaseUrl = (): string => {
  // Default URL - override in consuming apps via environment variables
  return 'https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net';
};

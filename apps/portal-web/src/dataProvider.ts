import type { DataProvider, GetListParams, GetOneParams, UpdateParams } from 'react-admin';
import type { IPublicClientApplication } from '@azure/msal-browser';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Global MSAL instance and client ID - will be set after user logs in
let msalInstance: IPublicClientApplication | null = null;
let currentClientId: string | null = null;
let currentUserId: number | null = null;

/**
 * Initialize the data provider with MSAL instance
 * Call this in App.tsx after MSAL initialization
 */
export const initializeDataProvider = (instance: IPublicClientApplication) => {
  msalInstance = instance;
};

/**
 * Set the client ID for multi-tenancy
 * Call this after fetching user profile
 */
export const setClientId = (clientId: string) => {
  currentClientId = clientId;
};

/**
 * Set the current user ID
 * Call this after fetching user profile
 */
export const setUserId = (userId: number) => {
  currentUserId = userId;
};

/**
 * Get authorization headers with access token
 */
const getAuthHeaders = async (includeContentType: boolean = true): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  // Add API key
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
    console.log('[DataProvider] Adding API key to headers');
  } else {
    console.warn('[DataProvider] ⚠️ VITE_API_KEY not found in environment!');
  }

  // Get access token from MSAL if available
  if (msalInstance) {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: accounts[0]
        });
        headers['Authorization'] = `Bearer ${tokenResponse.accessToken}`;

        // Also store token for API service
        sessionStorage.setItem('auth_token', tokenResponse.accessToken);
      }
    } catch (error: any) {
      console.error('Failed to acquire token:', error);

      // Check if it's a session expiration error
      if (error.name === 'InteractionRequiredAuthError' ||
          error.errorCode === 'interaction_required' ||
          error.message?.includes('interaction_required') ||
          error.message?.includes('AADSTS160021')) {
        console.log('[DataProvider] Session expired - redirecting to logout');
        // Logout and redirect to home
        await msalInstance.logoutRedirect({
          postLogoutRedirectUri: '/'
        });
      }

      throw error;
    }
  }

  return headers;
};

/**
 * Custom data provider for ProtocolSync backend API
 * Connects to the compliance endpoints built in previous days
 * Automatically filters data by client_id for multi-tenancy
 */
export const protocolSyncProvider: DataProvider = {
  // Get a list of resources
  getList: async (resource: string, params: GetListParams) => {
    let url = '';
    
    switch (resource) {
      case 'documents':
        // GET /api/v1/documents/current - get current documents
        // Will be filtered by client_id on backend
        url = `${API_BASE_URL}/documents/current`;
        if (currentClientId) {
          url += `?client_id=${currentClientId}`;
        }
        break;
      case 'protocol-documents':
        // GET /api/v1/documents - get all documents
        // Don't filter by user_id initially to show all documents
        // TODO: Re-enable user_id filter once all documents have uploaded_by_user_id
        url = `${API_BASE_URL}/documents?limit=100`;
        break;
      case 'protocol-versions':
        // GET /api/v1/protocol-versions - get protocol versions
        const docMasterId = params.filter?.masterId;
        if (docMasterId) {
          url = `${API_BASE_URL}/protocol-documents/${docMasterId}/versions`;
        } else {
          url = `${API_BASE_URL}/protocol-versions`;
        }
        if (currentClientId) {
          url += url.includes('?') ? `&client_id=${currentClientId}` : `?client_id=${currentClientId}`;
        }
        break;
      case 'versions':
        // GET /api/v1/document/:masterId/versions - get version history
        const masterId = params.filter?.masterId;
        if (masterId) {
          url = `${API_BASE_URL}/document/${masterId}/versions`;
          if (currentClientId) {
            url += `?client_id=${currentClientId}`;
          }
        }
        break;
      case 'users':
        // GET /api/v1/companies/:companyId/users - get company users
        const companyId = params.meta?.companyId;
        if (companyId) {
          url = `${API_BASE_URL}/companies/${companyId}/users`;
        }
        break;
      case 'site-users':
        // GET /api/v1/sites/:siteId/users - get site users
        const siteId = params.meta?.siteId;
        console.log('[DataProvider] site-users - siteId from params.meta:', siteId);
        console.log('[DataProvider] site-users - full params:', params);
        if (siteId) {
          url = `${API_BASE_URL}/sites/${siteId}/users`;
          console.log('[DataProvider] site-users - URL:', url);
        } else {
          console.error('[DataProvider] site-users - No siteId provided in params.meta');
        }
        break;
      case 'sites':
        // GET /api/v1/companies/:companyId/sites - get sites
        const sitesCompanyId = params.meta?.companyId;
        if (sitesCompanyId) {
          url = `${API_BASE_URL}/companies/${sitesCompanyId}/sites`;
        }
        break;
      case 'site-administrators':
        // GET /api/v1/companies/:companyId/administrators - get site administrators
        const adminsCompanyId = params.meta?.companyId;
        if (adminsCompanyId) {
          url = `${API_BASE_URL}/companies/${adminsCompanyId}/administrators`;
        }
        break;
      case 'trials':
        // GET /api/v1/trials?user_id=X - get trials for user
        const trialsUserId = params.meta?.userId || currentUserId;
        if (trialsUserId) {
          url = `${API_BASE_URL}/trials?user_id=${trialsUserId}`;
        }
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    if (!url) {
      console.error(`[DataProvider] No URL generated for resource: ${resource}`, params);
      return { data: [], total: 0 };
    }

    console.log(`[DataProvider] Fetching ${resource} from URL:`, url);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(url, { headers });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.log('[DataProvider] Authentication failed - logging out');
        if (msalInstance) {
          await msalInstance.logoutRedirect({
            postLogoutRedirectUri: '/'
          });
        }
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      
      console.log(`[DataProvider] Raw response for ${resource}:`, data);
      
      // Handle different response formats from backend
      let items = data;
      if (data.data) items = data.data; // Backend wraps in { success: true, data: [...] }
      if (data.documents) items = data.documents; // Some endpoints use { documents: [...] }
      
      console.log(`[DataProvider] Extracted items for ${resource}:`, items);
      
      // Transform data to ensure each item has an 'id' field
      // React-Admin requires all items to have an id
      const transformedData = Array.isArray(items) ? items : [items];
      const dataWithIds = transformedData.map((item: any, index: number) => {
        // For site-administrators, use site_user_role_id as the unique identifier
        if (resource === 'site-administrators') {
          return {
            ...item,
            id: item.site_user_role_id || item.user_id || `${resource}-${index}`
          };
        }
        // For site-users, use user_id as the identifier (simple site_users table)
        if (resource === 'site-users') {
          return {
            ...item,
            id: item.user_id || `${resource}-${index}`
          };
        }
        // For trials, use trial_id as the identifier
        if (resource === 'trials') {
          return {
            ...item,
            id: item.trial_id || `${resource}-${index}`
          };
        }
        // For other resources, use existing logic
        return {
          ...item,
          id: item.id || item.userId || item.user_id || item.site_id || item.role_id || item.document_id || item._id || item.version_id || item.master_id || `${resource}-${index}`
        };
      });
      
      console.log(`[DataProvider] Transformed data for ${resource}:`, dataWithIds);
      
      // React-Admin expects { data: [], total: number }
      return {
        data: dataWithIds,
        total: data.total || dataWithIds.length,
      };
    } catch (error) {
      console.error(`Error fetching ${resource}:`, error);
      // Return empty data on error
      return { data: [], total: 0 };
    }
  },

  // Get a single resource by ID
  getOne: async (resource: string, params: GetOneParams) => {
    let url = '';
    
    switch (resource) {
      case 'protocol-documents':
        url = `${API_BASE_URL}/documents/${params.id}`;
        break;
      case 'site-administrators':
        // For site-administrators, we need to get the list and find the specific one
        // since there's no dedicated GET single endpoint
        // We'll use the company administrators endpoint and filter
        url = `${API_BASE_URL}/companies/1/administrators`; // TODO: Get company ID dynamically
        break;
      case 'sites':
        // For sites, use the detail endpoint to get full site data including users
        url = `${API_BASE_URL}/sites/${params.id}`;
        break;
      default:
        url = `${API_BASE_URL}/${resource}/${params.id}`;
    }
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const responseData = await response.json();
      
      console.log(`[DataProvider] getOne raw response for ${resource}:`, responseData);

      // Handle sites - transform the response
      if (resource === 'sites') {
        const site = responseData.data;
        if (!site) {
          throw new Error('Site not found');
        }
        console.log(`[DataProvider] Found site:`, site);
        // Transform to have 'id' field
        return {
          data: {
            ...site,
            id: site.site_id
          }
        };
      }
      
      // Handle site-administrators - find the specific record
      if (resource === 'site-administrators') {
        const admins = responseData.data || [];
        const admin = admins.find((a: any) => a.site_user_role_id === parseInt(params.id as string));
        if (!admin) {
          throw new Error('Site administrator not found');
        }
        // Transform to have 'id' field
        return { 
          data: { 
            ...admin, 
            id: admin.site_user_role_id 
          } 
        };
      }
      
      return { data: responseData };
    } catch (error) {
      console.error(`Error fetching ${resource} ${params.id}:`, error);
      throw error;
    }
  },

  // Update a resource
  update: async (resource: string, params: UpdateParams) => {
    let url = '';
    let body: any = {};

    if (resource === 'users') {
      // PUT /api/v1/companies/:companyId/users/:userId
      const companyId = params.meta?.companyId || currentClientId;
      if (!companyId) {
        throw new Error('Missing company_id for updating user');
      }
      url = `${API_BASE_URL}/companies/${companyId}/users/${params.id}`;
      body = params.data;
      if (currentUserId) {
        url += `?user_id=${currentUserId}`;
      }
    } else if (resource === 'document-status' || resource === 'protocol-versions') {
      // PUT /api/v1/protocol-versions/:versionId/status
      url = `${API_BASE_URL}/protocol-versions/${params.id}/status`;
      body = { status: params.data.status };
    } else if (resource === 'site-administrators') {
      // PUT /api/v1/sites/:siteId/users/:roleId
      // Update the site_user_roles record
      const siteId = params.data.site_id || params.previousData?.site_id;
      const roleId = params.id;
      
      console.log('[DataProvider] UPDATE site-administrators:', {
        id: params.id,
        siteId,
        roleId,
        data: params.data,
        previousData: params.previousData
      });
      
      if (!siteId || !roleId) {
        console.error('[DataProvider] Missing site_id or role_id:', { siteId, roleId });
        throw new Error('Missing site_id or role_id for update');
      }
      
      url = `${API_BASE_URL}/sites/${siteId}/users/${roleId}`;
      body = {
        role_title: params.data.role_title || 'Site Administrator',
        status: params.data.status,
        can_upload_documents: params.data.can_upload_documents ?? true,
        can_set_compliance_status: params.data.can_set_compliance_status ?? true,
        can_manage_attestations: params.data.can_manage_attestations ?? true,
        can_manage_site_users: params.data.can_manage_site_users ?? true,
        can_export_reports: params.data.can_export_reports ?? true
      };
      
      console.log('[DataProvider] Update URL:', url);
      console.log('[DataProvider] Update body:', body);
      
      // Also update user info if changed
      if (params.data.full_name || params.data.job_title || params.data.department || params.data.professional_credentials || params.data.phone) {
        // Update user record separately
        const userId = params.data.user_id || params.previousData?.user_id;
        if (userId) {
          const userUpdateUrl = `${API_BASE_URL}/user/profile`;
          const userBody = {
            user_id: userId,
            name: params.data.full_name,
            job_title: params.data.job_title,
            department: params.data.department,
            professional_credentials: params.data.professional_credentials,
            phone: params.data.phone
          };
          
          console.log('[DataProvider] Updating user profile:', userUpdateUrl, userBody);
          
          const headers = await getAuthHeaders();
          const userResponse = await fetch(userUpdateUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(userBody)
          });
          
          if (!userResponse.ok) {
            const errorData = await userResponse.json().catch(() => ({ error: 'User update failed' }));
            console.error('[DataProvider] User update error:', errorData);
          } else {
            console.log('[DataProvider] User profile updated successfully');
          }
        }
      }
    } else {
      url = `${API_BASE_URL}/${resource}/${params.id}`;
      body = params.data;
    }

    try {
      const headers = await getAuthHeaders();
      
      console.log('[DataProvider] Sending PUT request:', { url, body });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      console.log('[DataProvider] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        console.error('[DataProvider] Update error response:', errorData);
        throw new Error(errorData.error || errorData.message || `API error: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('[DataProvider] Update successful:', responseData);
      
      // Return the updated data from server if available, otherwise return params data
      const updatedData = responseData.data || responseData;
      return { data: { ...params.data, ...updatedData, id: params.id } };
    } catch (error: any) {
      console.error(`[DataProvider] Error updating ${resource} ${params.id}:`, error);
      console.error('[DataProvider] Error stack:', error.stack);
      throw error;
    }
  },

  // Required methods (minimal implementations for now)
  getMany: async (_resource: string, _params: any) => {
    return { data: [] };
  },

  getManyReference: async (_resource: string, _params: any) => {
    return { data: [], total: 0 };
  },

  create: async (_resource: string, params: any) => {
    return { data: { id: 'temp', ...params.data } };
  },

  delete: async (resource: string, params: any) => {
    console.log('[DataProvider] DELETE request:', { resource, params, currentClientId });
    let url = '';
    
    switch (resource) {
      case 'users':
        // DELETE /api/v1/companies/:companyId/users/:userId
        const companyId = params.meta?.companyId || currentClientId;
        if (companyId) {
          url = `${API_BASE_URL}/companies/${companyId}/users/${params.id}`;
          if (currentUserId) {
            url += `?user_id=${currentUserId}`;
          }
        }
        break;
      case 'sites':
        // DELETE /api/v1/companies/:companyId/sites/:siteId
        const sitesCompanyId = params.meta?.companyId || currentClientId;
        if (sitesCompanyId) {
          url = `${API_BASE_URL}/companies/${sitesCompanyId}/sites/${params.id}`;
          if (currentUserId) {
            url += `?user_id=${currentUserId}`;
          }
        }
        break;
      case 'site-administrators':
        // DELETE /api/v1/sites/:siteId/administrators/:userId
        // params.id is site_user_role_id, we need site_id and user_id from previousData
        const adminSiteId = params.previousData?.site_id;
        const adminUserId = params.previousData?.user_id;
        console.log('[DataProvider] DELETE site-administrators:', { 
          id: params.id, 
          siteId: adminSiteId, 
          userId: adminUserId,
          previousData: params.previousData 
        });
        if (adminSiteId && adminUserId) {
          url = `${API_BASE_URL}/sites/${adminSiteId}/administrators/${adminUserId}`;
        }
        break;
      case 'site-users':
        // DELETE /api/v1/sites/:siteId/users/:userId - remove user from site
        const siteUserSiteId = params.meta?.siteId || params.previousData?.site_id;
        const siteUserId = params.id; // This is user_id
        console.log('[DataProvider] DELETE site-users:', { 
          id: params.id, 
          siteId: siteUserSiteId, 
          userId: siteUserId,
          previousData: params.previousData 
        });
        if (siteUserSiteId && siteUserId) {
          url = `${API_BASE_URL}/sites/${siteUserSiteId}/users/${siteUserId}`;
        }
        break;
      default:
        throw new Error(`Delete not supported for resource: ${resource}`);
    }

    if (!url) {
      throw new Error(`Missing required parameters for deleting ${resource}`);
    }

    console.log('[DataProvider] DELETE URL:', url);

    try {
      // Prepare request body for endpoints that require it
      let body: string | undefined = undefined;

      if (resource === 'sites') {
        body = JSON.stringify({
          requester_role: 'admin',
          hard_delete: true
        });
      } else if (resource === 'site-administrators') {
        body = JSON.stringify({
          requester_role: 'admin',
          hard_delete: true
        });
      } else if (resource === 'site-users') {
        body = JSON.stringify({
          requester_role: 'admin'
        });
      }

      // Only include Content-Type header when we have a body
      // Fastify rejects DELETE requests with Content-Type: application/json but no body (415 error)
      const headers = await getAuthHeaders(!!body);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        body
      });

      console.log('[DataProvider] DELETE response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete' }));
        console.error('[DataProvider] DELETE error:', errorData);
        throw new Error(errorData.error || `Failed to delete ${resource}`);
      }

      console.log('[DataProvider] DELETE successful');
      return { data: params.previousData };
    } catch (error) {
      console.error(`Error deleting ${resource} ${params.id}:`, error);
      throw error;
    }
  },

  deleteMany: async (_resource: string, params: any) => {
    return { data: params.ids };
  },

  updateMany: async (_resource: string, params: any) => {
    return { data: params.ids };
  },
};

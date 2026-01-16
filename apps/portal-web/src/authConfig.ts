import type { Configuration, PopupRequest } from '@azure/msal-browser';

// MSAL configuration for Azure Entra ID (formerly Azure AD)
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'd29b70a1-86f2-4ae4-8da9-823416860cda',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || '0ed0888e-3a5b-42f0-8ceb-bab9e938f05d'}`,
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: false, // Prevent automatic navigation after login
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Custom API scope for ProtocolSync backend
const API_SCOPE = 'api://65b5eddd-4d68-421e-97a1-65399bfb4a48/access_as_user';

// Scopes for login - request the custom API scope
export const loginRequest: PopupRequest = {
  scopes: [API_SCOPE],
  prompt: 'select_account', // Always show account picker
};

// API scopes for silent token acquisition
export const apiScopes = [API_SCOPE];

/**
 * Configuration notes:
 * 
 * To set up Azure Entra ID:
 * 1. Go to Azure Portal > Microsoft Entra ID > App registrations
 * 2. Create a new registration for "ProtocolSync Portal"
 * 3. Set Redirect URI to http://localhost:5173 (for development)
 * 4. Copy the Application (client) ID and Directory (tenant) ID
 * 5. Update the values above
 * 6. Under "Authentication", enable "Access tokens" and "ID tokens"
 * 7. Under "API permissions", add Microsoft Graph > User.Read
 */

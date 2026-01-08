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

// Scopes for the API access
export const loginRequest: PopupRequest = {
  scopes: ['User.Read'], // Microsoft Graph API permission
  prompt: 'select_account', // Always show account picker
};

// API scopes if you have a custom backend API registered in Azure AD
export const apiRequest = {
  scopes: ['api://YOUR_API_CLIENT_ID/.default'], // Replace with your API scope
};

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

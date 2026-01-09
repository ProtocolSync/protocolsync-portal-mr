import ENV from './env';

// MSAL configuration for React Native
export const msalConfig = {
  auth: {
    clientId: ENV.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${ENV.AZURE_TENANT_ID}`,
  },
};

// Scopes for the API access
export const loginRequest = {
  scopes: ['User.Read'], // Microsoft Graph API permission
  prompt: 'select_account' as const, // Always show account picker
};

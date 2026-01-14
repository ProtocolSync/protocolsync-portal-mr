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
  scopes: ['api://65b5eddd-4d68-421e-97a1-65399bfb4a48/access_as_user'], // Custom API permission
  prompt: 'select_account' as const, // Always show account picker
};

/**
 * Environment Configuration
 * This file loads environment variables for the mobile app
 *
 * Note: Using expo-constants to read from app.json extra config
 * This is the recommended way for Expo development
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const ENV = {
  API_URL: extra.apiUrl || 'http://localhost:3000/api/v1',
  API_KEY: extra.apiKey || '',
  AZURE_CLIENT_ID: extra.azureClientId || '',
  AZURE_TENANT_ID: extra.azureTenantId || '',
  WEBSITE_URL: extra.websiteUrl || 'http://localhost:5174',
};

console.log('📝 Loaded environment config:', {
  API_URL: ENV.API_URL,
  AZURE_CLIENT_ID: ENV.AZURE_CLIENT_ID?.substring(0, 8) + '...',
  AZURE_TENANT_ID: ENV.AZURE_TENANT_ID?.substring(0, 8) + '...',
});

export default ENV;

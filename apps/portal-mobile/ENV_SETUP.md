# Environment Variables Not Loading - Fix Required

## Issue

Expo doesn't automatically load `.env` files. The environment variables need to be configured differently.

## Solution Options

### Option 1: Use app.json extra config (Recommended for Expo)

Update `app.json`:

```json
{
  "expo": {
    "name": "portal-mobile",
    "slug": "portal-mobile",
    "extra": {
      "apiUrl": "http://localhost:3000/api/v1",
      "apiKey": "ps_3860279e30a2f9e4edc356f11de40ab66c849a02e26434b6076e70053dfa6127",
      "azureClientId": "65b5eddd-4d68-421e-97a1-65399bfb4a48",
      "azureTenantId": "0ed0888e-3a5b-42f0-8ceb-bab9e938f05d"
    }
  }
}
```

Then update `src/config/env.ts`:

```typescript
import Constants from 'expo-constants';

export const ENV = {
  API_URL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api/v1',
  API_KEY: Constants.expoConfig?.extra?.apiKey || '',
  AZURE_CLIENT_ID: Constants.expoConfig?.extra?.azureClientId || '',
  AZURE_TENANT_ID: Constants.expoConfig?.extra?.azureTenantId || '',
};

export default ENV;
```

### Option 2: Install babel-plugin-inline-dotenv

```bash
npm install --save-dev babel-plugin-inline-dotenv
```

Create `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['inline-dotenv']
  };
};
```

### Option 3: Hardcode for now (Quick test)

Directly update `src/config/env.ts`:

```typescript
export const ENV = {
  API_URL: 'http://localhost:3000/api/v1',
  API_KEY: 'ps_3860279e30a2f9e4edc356f11de40ab66c849a02e26434b6076e70053dfa6127',
  AZURE_CLIENT_ID: '65b5eddd-4d68-421e-97a1-65399bfb4a48',
  AZURE_TENANT_ID: '0ed0888e-3a5b-42f0-8ceb-bab9e938f05d',
};

export default ENV;
```

## Current Status

The `.env` file exists but variables are not being loaded because:
1. Expo needs explicit configuration
2. `process.env.EXPO_PUBLIC_*` only works with EAS builds, not local development
3. Need one of the solutions above

## Recommended Next Step

Use **Option 1** (app.json extra config) as it's the most Expo-native approach.

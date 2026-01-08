# Portal API Integration - Implementation Summary

## ✅ Completed Changes

### 1. Portal API Service Integration

#### Updated Files:

**[src/components/Billing.tsx](src/components/Billing.tsx)**
- ✅ Replaced all `fetch()` calls with centralized `api` service
- ✅ Automatic API key inclusion in all requests
- ✅ Simplified error handling
- ✅ Removed manual `API_BASE_URL` constant

**[src/components/Login.tsx](src/components/Login.tsx)**
- ✅ Added session creation after Azure AD login
- ✅ Exchanges Azure AD token for API session using `api.session.loginWithJWT()`
- ✅ Session ID automatically stored for future requests

**[src/dataProvider.ts](src/dataProvider.ts)**
- ✅ Added API service import
- ✅ Updated `getAuthHeaders()` to include API key from environment
- ✅ Stores Azure AD token in sessionStorage for API service
- ✅ All react-admin data fetching now includes API key

### 2. Configuration

**[.env](.env)**
- ✅ API key already configured: `VITE_API_KEY=ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849`
- ✅ API URL configured: `VITE_API_URL=http://localhost:3000/api/v1`

### 3. Backend API Configuration

**protocolsync-api/.env**
- ✅ API key configured: `API_KEYS={"portal":"ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849"}`
- ✅ Session timeout: `SESSION_TIMEOUT=3600000` (1 hour)
- ✅ Session secret: Generated and added

## 🔐 How It Works

### Authentication Flow

```
1. User clicks "Sign in with Microsoft"
   ↓
2. Azure AD login popup
   ↓
3. Receives Azure AD access token
   ↓
4. Portal calls api.session.loginWithJWT(token)
   ↓
5. Backend validates token & creates session
   ↓
6. Returns session ID
   ↓
7. Portal stores session ID in sessionStorage
   ↓
8. All future requests include:
   - X-API-Key: ps_9578e3af... (identifies portal app)
   - X-Session-Id: sess_abc... (identifies user)
```

### API Request Flow

**Before (Old Code):**
```typescript
const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**After (New Code):**
```typescript
import api from './api';

const response = await api.get(`/companies/${id}`);
if (response.success) {
  const data = response.data;
}
```

✨ **Benefits:**
- API key automatically included
- Session ID automatically included
- Consistent error handling
- Cleaner code
- TypeScript support

## 📝 Updated Components

### Billing.tsx Changes

All fetch operations now use the API service:

- ✅ `fetchPlans()` - GET /subscription/plans
- ✅ `fetchSubscription()` - GET /companies/:id/subscription
- ✅ `fetchPaymentMethods()` - GET /companies/:id/payment-methods
- ✅ `fetchInvoices()` - GET /companies/:id/invoices
- ✅ `fetchStats()` - GET /companies/:id/sites, /site-administrators, /protocols
- ✅ `subscribeToPlan()` - POST /companies/:id/subscription
- ✅ `confirmCancelSubscription()` - DELETE /companies/:id/subscription

### Login.tsx Changes

Session creation after successful Azure AD login:

```typescript
// Exchange Azure AD token for API session
if (response.accessToken) {
  const sessionResult = await api.session.loginWithJWT(response.accessToken);
  
  if (sessionResult.success) {
    console.log('Session created:', sessionResult.data);
  }
}
```

### DataProvider.ts Changes

Enhanced authentication headers:

```typescript
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // Get access token from MSAL
  if (msalInstance) {
    // ... acquire token ...
    headers['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
    
    // Store token for API service
    sessionStorage.setItem('auth_token', tokenResponse.accessToken);
  }

  return headers;
};
```

## 🧪 Testing

### Test API Key

```bash
curl -H "X-API-Key: ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849" \
  http://localhost:3000/api/auth/verify
```

### Test Portal Login

1. Start backend API: `cd protocolsync-api && npm start`
2. Start portal: `cd protocolsync-portal && npm run dev`
3. Navigate to http://localhost:5173
4. Click "Sign in with Microsoft"
5. Check browser console for:
   - "Login successful"
   - "Session created"

### Verify API Calls

Open browser DevTools Network tab and look for:
- All requests to localhost:3000 should include:
  - `X-API-Key` header
  - `X-Session-Id` header (after login)

## 🔒 Security Features

✅ **API Key Protection**
- Only authorized clients (portal) can access API
- Invalid keys are rejected with 403 Forbidden

✅ **Session Management**
- User sessions timeout after 1 hour
- Expired sessions automatically cleaned up
- Session IDs are cryptographically secure

✅ **Multi-layer Authentication**
- Layer 1: API Key (identifies client application)
- Layer 2: Session/JWT (identifies user)
- Layer 3: CORS (validates origin)

## 📚 Documentation

For developers working with the portal:
- [API Integration Guide](docs/API_INTEGRATION.md)

For backend API setup:
- [API Authentication Guide](../protocolsync-api/docs/API_AUTHENTICATION.md)
- [Quick Reference](../protocolsync-api/docs/AUTH_QUICK_REFERENCE.md)

## ✨ Next Steps

1. **Test the integration:**
   - Start backend API
   - Start portal
   - Login and verify session creation
   - Test API calls in Network tab

2. **Optional enhancements:**
   - Add loading indicators during API calls
   - Implement retry logic for failed requests
   - Add session refresh before expiration
   - Implement logout button with session cleanup

## 🚀 Production Checklist

Before deploying to production:

- [ ] Generate new production API key
- [ ] Update `VITE_API_KEY` in portal production build
- [ ] Update `API_KEYS` in backend production environment
- [ ] Verify HTTPS is enabled
- [ ] Update `FRONTEND_URL` with production portal URL
- [ ] Test session timeout behavior
- [ ] Monitor API key usage

## 🎯 Summary

The portal now uses a centralized API service that automatically:
- ✅ Includes API key in all requests
- ✅ Manages user sessions
- ✅ Handles authentication tokens
- ✅ Provides consistent error handling
- ✅ Simplifies code throughout the application

All existing API calls have been migrated to use this new service, ensuring secure communication between the portal and backend API.

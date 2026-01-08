# API Connection Guide

## How the Portal Connects to Your Backend API

### 🔗 Connection Flow

```
User Logs In
    ↓
Azure AD Returns JWT Token
    ↓
Frontend Stores Token (MSAL)
    ↓
UserContext Fetches Profile
    ↓
Profile Returns client_id
    ↓
Data Provider Uses Token + client_id
    ↓
All API Calls Authenticated & Filtered
```

---

## ✅ What Just Got Fixed

### 1. **JWT Token Authentication**
The data provider now automatically includes your Azure AD access token in all API requests:

```typescript
// Every API call now includes:
headers: {
  'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGci...',
  'Content-Type': 'application/json'
}
```

### 2. **Multi-Tenant Filtering**
After you log in, your `client_id` is automatically added to all API requests:

```typescript
// Before: GET /api/v1/documents/current
// After:  GET /api/v1/documents/current?client_id=your-uuid-here
```

### 3. **Automatic Token Refresh**
MSAL handles token expiration automatically - you don't need to do anything.

---

## 🚀 Quick Start

### Step 1: Start Your Backend API
Your backend should be running on `http://localhost:3000` with these endpoints:

| Endpoint | Method | Headers Required |
|----------|--------|-----------------|
| `/api/v1/user/profile` | GET | `Authorization: Bearer <token>` |
| `/api/v1/documents/current` | GET | `Authorization: Bearer <token>` |
| `/api/v1/document/:masterId/versions` | GET | `Authorization: Bearer <token>` |
| `/api/v1/document/:versionId/status` | PUT | `Authorization: Bearer <token>` |

### Step 2: Start the Portal
```bash
npm run dev
```

### Step 3: Login
Sign in with your Microsoft account. The portal will:
1. Get your Azure AD token
2. Call `/api/v1/user/profile` to get your `client_id`
3. Automatically filter all future requests by your `client_id`

---

## 🔍 Testing the Connection

### Check Network Calls
1. Open DevTools → Network tab
2. Log in to the portal
3. You should see:
   - `POST https://login.microsoftonline.com/...` (Azure AD)
   - `GET http://localhost:3000/api/v1/user/profile` (Your backend)
   - `GET http://localhost:3000/api/v1/documents/current?client_id=...` (Your backend)

### Check Request Headers
Click on any API request in Network tab → Headers:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6...
Content-Type: application/json
```

### Check Response Data
Click on any API request → Response tab. You should see your actual data.

---

## ⚙️ Configuration

### Change Backend URL
If your backend isn't on `localhost:3000`:

1. Create `.env` file:
```bash
VITE_API_URL=http://localhost:3001/api/v1
```

2. Restart dev server:
```bash
npm run dev
```

### Environment Variables
```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api/v1

# Azure AD Configuration (already in authConfig.ts)
VITE_AZURE_CLIENT_ID=d29b70a1-86f2-4ae4-8da9-823416860cda
VITE_AZURE_TENANT_ID=0ed0888e-3a5b-42f0-8ceb-bab9e938f05d
```

---

## 🐛 Troubleshooting

### "Unable to load documents. Using mock data."
**Problem:** Backend API isn't responding or returns an error.

**Solutions:**
1. Check if backend is running: `curl http://localhost:3000/api/v1/documents/current`
2. Check DevTools Console for error messages
3. Verify backend accepts the token format from Azure AD

### "401 Unauthorized"
**Problem:** Backend rejected the JWT token.

**Solutions:**
1. Verify your backend validates Azure AD tokens correctly
2. Check the token in jwt.io - make sure it has the right audience (`aud`)
3. Ensure backend uses the right public keys from Azure AD

### "404 User profile not found"
**Problem:** User exists in Azure AD but not in your database.

**Solutions:**
1. Run the database migration: `003_add_clients_and_users.sql`
2. Insert your user with your Azure AD Object ID
3. Check backend logs for the exact error

---

## 📝 Backend Requirements

Your backend must:

### 1. Accept Azure AD JWT Tokens
```typescript
// Example middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // Validate token against Azure AD public keys
  jwt.verify(token, getAzurePublicKey, (err, decoded) => {
    req.user = decoded;
    next();
  });
});
```

### 2. Return User Profile
```typescript
GET /api/v1/user/profile
Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "role": "site_admin",
  "clientId": "uuid-of-research-site",
  "client": {
    "name": "Research Site Name",
    "organizationType": "research_site"
  }
}
```

### 3. Filter Data by client_id
```typescript
GET /api/v1/documents/current?client_id=uuid-here

// Backend should:
SELECT * FROM documents 
WHERE client_id = $1 AND status = 'Current'
```

---

## 📚 Files Modified

| File | Change |
|------|--------|
| `src/dataProvider.ts` | Added `initializeDataProvider()`, JWT token handling |
| `src/contexts/UserContext.tsx` | Calls `setClientId()` after fetching profile |
| `src/App.tsx` | Initializes data provider with MSAL instance |

---

## ✨ What Happens Next

Once your backend responds:

1. **Dashboard loads live data** - No more "Unable to load documents" message
2. **Protocol list appears** - Shows actual protocols from your database
3. **Version history works** - Clicking protocols shows real version data
4. **Status updates work** - "Set to Current" button calls your PUT endpoint
5. **Multi-tenancy active** - Each user only sees their site's data

---

## 🎯 Summary

**Before:** Portal couldn't talk to backend (no JWT token, no client_id filtering)

**After:** 
- ✅ JWT token automatically included in all API calls
- ✅ User profile fetched on login
- ✅ client_id automatically added to all requests
- ✅ Token refresh handled automatically by MSAL

**Result:** Portal is now fully connected and ready to display live data from your backend!

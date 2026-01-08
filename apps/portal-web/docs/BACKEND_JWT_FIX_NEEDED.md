# Backend JWT Authentication Fix Required

## Issue Summary
The portal is successfully sending JWT tokens to the backend, but the backend is not extracting the Azure AD Object ID (`oid`) claim from the token.

## Current Error
```
GET http://localhost:3000/api/v1/user/profile 400 (Bad Request)

Response: {
  "success": false,
  "error": "Authentication required",
  "message": "No Azure AD Object ID found in token or query parameters",
  "hint": "Make sure you are passing a valid JWT token in the Authorization header"
}
```

## Portal is Sending Correctly ✅
The frontend console logs prove the portal is working correctly:

```javascript
// From UserContext.tsx console logs:
Account info: {
  username: 'david@protocolsync.org',
  name: 'David Tay',
  localAccountId: '82c69fab-9f44-41f2-aaf1-cc4eb967aea3',  // This is the oid
  homeAccountId: '00000000-0000-0000-29aa-ce75f358e411.9188040d-6c67-4c5b-b112-36a304b66dad'
}

Token: eyJ0eXAiOiJKV1QiLCJub25jZSI6ImJPV2xiVFhfemlDanVQS1...
Authorization Header: Bearer <token>
```

## What Backend Must Do

### 1. JWT Verification
The backend JWT middleware must:
- Validate the token signature using Azure AD's public keys (JWKS)
- Decode the token to extract claims
- Access the `oid` claim from the decoded token

### 2. Expected Token Claims
The JWT token contains these claims (among others):
```json
{
  "oid": "82c69fab-9f44-41f2-aaf1-cc4eb967aea3",
  "preferred_username": "david@protocolsync.org",
  "name": "David Tay",
  "tid": "0ed0888e-3a5b-42f0-8ceb-bab9e938f05d"
}
```

### 3. Reference Implementation
See `backend-reference/authMiddleware.ts` for a complete reference implementation using `jwks-rsa`.

Key points:
```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Configure JWKS client for Azure AD
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
});

// Get signing key
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Verify token
jwt.verify(token, getKey, {
  audience: CLIENT_ID,
  issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`
}, (err, decoded: any) => {
  if (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Extract oid claim
  const azureAdObjectId = decoded.oid;  // ⭐ THIS IS WHAT'S MISSING
  
  // Attach to request
  req.user = {
    azureAdObjectId: azureAdObjectId,
    email: decoded.preferred_username
  };
  
  next();
});
```

### 4. User Profile Endpoint Flow
After JWT middleware extracts the `oid`:

```typescript
// GET /api/v1/user/profile
app.get('/api/v1/user/profile', authMiddleware, async (req, res) => {
  const azureAdObjectId = req.user.azureAdObjectId;  // From JWT middleware
  
  // Query database
  const user = await db.query(
    'SELECT * FROM users WHERE azure_ad_user_id = $1',
    [azureAdObjectId]
  );
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Return profile
  res.json({
    user_id: user.user_id,
    client_id: user.client_id,
    azure_ad_user_id: user.azure_ad_user_id,
    email: user.email,
    name: user.name,
    role: user.role,
    client_name: user.client_name  // from JOIN with clients table
  });
});
```

## Debugging Steps

### Step 1: Check JWT Verification
Add console logs to your JWT middleware:
```typescript
console.log('Token received:', token.substring(0, 50) + '...');

jwt.verify(token, getKey, options, (err, decoded) => {
  if (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  console.log('✅ JWT verified successfully');
  console.log('Decoded token claims:', JSON.stringify(decoded, null, 2));
  console.log('OID claim:', decoded.oid);
  
  // Continue...
});
```

### Step 2: Verify JWKS Configuration
Make sure your JWKS URI matches the tenant:
```
https://login.microsoftonline.com/0ed0888e-3a5b-42f0-8ceb-bab9e938f05d/discovery/v2.0/keys
```

### Step 3: Check Token Validation Options
Ensure these match your Azure AD app registration:
```typescript
{
  audience: 'd29b70a1-86f2-4ae4-8da9-823416860cda',  // Client ID
  issuer: 'https://login.microsoftonline.com/0ed0888e-3a5b-42f0-8ceb-bab9e938f05d/v2.0'
}
```

## Required Database Record
The users table must have a record for this user:
```sql
SELECT * FROM users WHERE azure_ad_user_id = '82c69fab-9f44-41f2-aaf1-cc4eb967aea3';
```

Expected result:
```
user_id: 1
client_id: 1
azure_ad_user_id: '82c69fab-9f44-41f2-aaf1-cc4eb967aea3'
email: 'david@protocolsync.org'
name: 'David Tay'
role: 'protocol_coordinator'
```

## Additional Backend Issues

### Issue 2: Missing `id` Fields in API Responses
The `/api/v1/documents/current` and `/api/v1/document/:masterId/versions` endpoints are returning data without `id` fields.

**Fix**: Ensure all API responses include an `id` field:
```typescript
// Documents should have:
{
  id: "unique-id",           // ⭐ Required by React-Admin
  masterId: "...",
  versionNumber: "...",
  protocolName: "...",
  status: "...",
  lastModified: "..."
}

// Versions should have:
{
  id: "unique-id",           // ⭐ Required by React-Admin
  versionNumber: "...",
  status: "...",
  uploadedAt: "...",
  uploadedBy: "..."
}
```

**Temporary Frontend Workaround**: The portal now has a fallback that uses `version_id` or `master_id` if `id` is missing, but the backend should still provide proper `id` fields.

## Next Steps
1. ✅ Portal team: Added defensive `id` transformation in dataProvider
2. ⏳ **Backend team**: Fix JWT middleware to extract `decoded.oid`
3. ⏳ **Backend team**: Add proper `id` fields to all API responses
4. ⏳ **Backend team**: Provide console logs showing decoded token contents

Once JWT middleware is fixed, the portal will automatically:
- Display user profile in sidebar
- Filter all data by the user's `client_id`
- Enable full multi-tenant functionality

# Day 11 Part 2: User Setup and Multi-Tenancy Implementation

## 🎯 Overview

This implementation adds user management and multi-tenancy support to ProtocolSync, allowing multiple research sites to use the same platform while keeping their data isolated.

---

## 📊 Database Schema

### Tables Created

#### 1. **`clients` Table**
Stores research sites, CROs, and sponsor organizations.

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    organization_type VARCHAR(50),  -- 'research_site', 'cro', 'sponsor'
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Purpose:** Each research site is a "client" with isolated data.

#### 2. **`users` Table**
Stores user profiles linked to Azure Entra ID.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    azure_ad_user_id VARCHAR(255) UNIQUE NOT NULL,  -- From Azure AD token
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    client_id UUID REFERENCES clients(id),  -- Links user to their site
    role VARCHAR(50) NOT NULL,  -- 'site_admin', 'coordinator', etc.
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields:**
- `azure_ad_user_id`: Matches the `oid` (Object ID) from Azure AD JWT token
- `client_id`: Enforces multi-tenancy - all queries filter by this
- `role`: Determines permissions (site_admin, coordinator, investigator, monitor, viewer)

### Indexes

Performance optimizations:
```sql
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_azure_ad_user_id ON users(azure_ad_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active) WHERE active = true;
```

---

## 🔐 Authentication Flow

### 1. **User Logs In (Frontend)**
```typescript
// User clicks "Sign in with Microsoft"
const response = await instance.loginPopup(loginRequest);
// Azure returns JWT token with user's Azure AD Object ID (oid)
```

### 2. **Token Validation (Backend Middleware)**
```typescript
// Middleware extracts and validates JWT from Authorization header
const token = req.headers.authorization; // "Bearer eyJ0eXAiOiJKV1..."

// Verify signature using Azure AD public keys
jwt.verify(token, getAzureADPublicKey, (err, decoded) => {
  req.user = {
    oid: decoded.oid,        // Azure AD Object ID
    email: decoded.email,
    name: decoded.name
  };
});
```

### 3. **Fetch User Profile (Backend API)**
```typescript
GET /api/v1/user/profile

// Uses oid from JWT to query database
SELECT u.*, c.name AS client_name
FROM users u
JOIN clients c ON u.client_id = c.id
WHERE u.azure_ad_user_id = $1  -- oid from token
```

### 4. **Store User Context (Frontend)**
```typescript
// UserContext stores profile globally
const { user } = useUser();
// user.clientId is used for all subsequent API calls
```

---

## 🚀 Backend Implementation

### Required Files

#### 1. **Database Migration**
File: `database/migrations/003_add_clients_and_users.sql`

Run migration:
```bash
psql -U postgres -d protocolsync -f database/migrations/003_add_clients_and_users.sql
```

#### 2. **Authentication Middleware**
File: `backend-reference/authMiddleware.ts`

**Install dependencies:**
```bash
npm install jsonwebtoken jwks-rsa @types/jsonwebtoken
```

**Usage in Express routes:**
```typescript
import { validateAzureADToken } from './middleware/authMiddleware';

// Protected route
app.get('/api/v1/user/profile', 
  validateAzureADToken,  // Validates JWT and extracts user
  getUserProfile
);
```

#### 3. **User Profile API Endpoint**
File: `backend-reference/userProfile.ts`

**Endpoint:** `GET /api/v1/user/profile`

**Response:**
```json
{
  "id": "uuid-here",
  "azureAdUserId": "azure-ad-oid-here",
  "email": "david@protocolsync.org",
  "displayName": "David Taylor",
  "role": "site_admin",
  "clientId": "uuid-of-research-site",
  "client": {
    "name": "ProtocolSync Demo Site",
    "organizationType": "research_site"
  },
  "lastLogin": "2025-11-24T21:30:00Z"
}
```

#### 4. **Environment Variables**
Add to `.env`:
```bash
AZURE_AD_TENANT_ID=0ed0888e-3a5b-42f0-8ceb-bab9e938f05d
AZURE_AD_CLIENT_ID=d29b70a1-86f2-4ae4-8da9-823416860cda
```

---

## 🎨 Frontend Implementation

### Files Created/Modified

#### 1. **User Context** 
File: `src/contexts/UserContext.tsx`

Provides global access to user profile:
```typescript
const { user, loading, error } = useUser();

// Access user data anywhere
console.log(user.clientId);  // For filtering
console.log(user.role);       // For permissions
console.log(user.client.name); // Research site name
```

#### 2. **User Profile Display**
File: `src/components/UserProfileDisplay.tsx`

Shows in sidebar:
- User name and email
- Role badge (color-coded)
- Research site name
- Sign out button

#### 3. **Data Provider with Multi-Tenancy**
File: `src/dataProvider.ts`

Automatically adds `client_id` to all API requests:
```typescript
// Old: GET /api/v1/documents/current
// New: GET /api/v1/documents/current?client_id=uuid-here

export const setClientId = (clientId: string) => {
  // Called after user logs in
};
```

#### 4. **Updated App.tsx**
Wraps application in `UserProvider`:
```typescript
<MsalProvider instance={msalInstance}>
  <UserProvider>  {/* New */}
    <ProtectedRoute>
      <Admin ...>
```

---

## 🔄 Complete Flow

### Login to Dashboard

1. **User visits portal** → Login screen
2. **User clicks "Sign in with Microsoft"** → Azure AD popup
3. **Azure authenticates** → Returns JWT with `oid`
4. **Frontend stores token** → MSAL handles this
5. **Frontend fetches profile** → `GET /api/v1/user/profile` with JWT
6. **Backend validates JWT** → Extracts `oid`
7. **Backend queries database** → Finds user by `azure_ad_user_id`
8. **Returns user profile** → Includes `client_id` and `role`
9. **Frontend stores in context** → Available to all components
10. **Dashboard loads** → All data filtered by `client_id`

### Multi-Tenancy in Action

**Example: Site A queries documents**
```
User from Site A logs in
→ clientId = "550e8400-e29b-41d4-a716-446655440000"
→ GET /api/v1/documents/current?client_id=550e8400...
→ Returns only Site A's documents
```

**Example: Site B queries documents**
```
User from Site B logs in
→ clientId = "different-uuid-here"
→ GET /api/v1/documents/current?client_id=different-uuid
→ Returns only Site B's documents
```

**Database ensures isolation:**
```sql
-- All queries filter by client_id
SELECT * FROM documents 
WHERE client_id = $1  -- User's client_id from token
  AND status = 'Current';
```

---

## 👥 User Roles

### Role Definitions

| Role | Permissions | Typical User |
|------|------------|--------------|
| `site_admin` | Full access to site data, can manage users | Site Administrator |
| `coordinator` | Manage protocols, upload documents | Study Coordinator |
| `investigator` | View protocols, attest signatures | Principal Investigator |
| `monitor` | Read-only access for audits | CRA/Monitor |
| `viewer` | Limited read-only access | Support staff |

### Implementation

**Backend:**
```typescript
// Middleware to require specific role
app.put('/api/v1/document/:id/status',
  validateAzureADToken,
  requireRole('site_admin', 'coordinator'),  // Only these roles
  updateDocumentStatus
);
```

**Frontend:**
```typescript
const { user } = useUser();

{user.role === 'site_admin' && (
  <button onClick={deleteDocument}>Delete</button>
)}
```

---

## 🧪 Testing

### 1. Create Test Data

```sql
-- Insert test client
INSERT INTO clients (id, name, organization_type, contact_email)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 
        'Test Research Site', 
        'research_site',
        'test@site.com');

-- Insert test user (replace azure_ad_user_id with your actual Azure AD Object ID)
INSERT INTO users (azure_ad_user_id, email, display_name, client_id, role)
VALUES ('your-azure-ad-oid-here',
        'david@protocolsync.org',
        'David Taylor',
        '550e8400-e29b-41d4-a716-446655440000',
        'site_admin');
```

### 2. Get Your Azure AD Object ID

**Option A: From JWT token**
1. Log in to the portal
2. Open browser DevTools → Application → Session Storage
3. Find MSAL token
4. Decode at jwt.io
5. Copy the `oid` value

**Option B: From Azure Portal**
1. Go to Microsoft Entra ID
2. Click "Users"
3. Find your user
4. Copy "Object ID"

### 3. Test User Profile API

```bash
# Get access token (you'd do this programmatically)
TOKEN="your-jwt-token-here"

# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/v1/user/profile
```

Expected response:
```json
{
  "id": "...",
  "email": "david@protocolsync.org",
  "role": "site_admin",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "client": {
    "name": "Test Research Site",
    "organizationType": "research_site"
  }
}
```

---

## 📝 Next Steps

### For Full Live Integration:

1. **Backend Setup:**
   - Run database migration
   - Implement authentication middleware
   - Create user profile endpoint
   - Add `client_id` filtering to all document queries

2. **Environment Configuration:**
   - Set Azure AD credentials in `.env`
   - Configure database connection

3. **Frontend Updates:**
   - User profile should load automatically on login
   - All API calls will include `client_id`
   - Sidebar shows user info

4. **Data Migration:**
   - Add `client_id` column to existing `documents` table
   - Assign documents to appropriate clients
   - Update all queries to filter by `client_id`

---

## 🎯 Benefits

✅ **Multi-Tenancy:** Multiple research sites on one platform  
✅ **Data Isolation:** Sites can only see their own data  
✅ **Role-Based Access:** Granular permissions per user  
✅ **Azure AD Integration:** Enterprise-grade authentication  
✅ **Audit Trail:** Track who accessed what data  
✅ **Scalable:** Add unlimited sites and users  

---

**Status:** User setup and multi-tenancy foundation complete ✅  
**Next:** Integrate with live backend API for full functionality

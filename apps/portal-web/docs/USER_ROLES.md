# User Roles & Permissions

## Overview
The ProtocolSync portal implements role-based access control (RBAC) integrated with Azure Entra ID authentication. User roles determine access levels and available features.

## Role Hierarchy

### 1. Site Admin
**Badge Color**: Blue (`#dbeafe` / `#1e40af`)

**Permissions**:
- ✅ Full system access
- ✅ Create delegations
- ✅ View all delegations
- ✅ Upload protocol documents
- ✅ Manage protocol versions
- ✅ Set current protocol status
- ✅ Sign delegations (when assigned)

**Use Case**: Clinical research site administrators, IT managers

### 2. Investigator
**Badge Color**: Purple (`#e0e7ff` / `#3730a3`)

**Permissions**:
- ✅ Create delegations
- ✅ View all delegations
- ✅ Upload protocol documents
- ✅ View protocol versions
- ✅ Sign delegations (when assigned)

**Use Case**: Principal Investigators, Sub-Investigators

### 3. Coordinator
**Badge Color**: Green (`#d1fae5` / `#065f46`)

**Permissions**:
- ❌ Cannot create delegations
- ⚠️ View own delegations only
- ✅ View protocol documents
- ✅ Sign delegations (when assigned)

**Use Case**: Study Coordinators, Clinical Research Coordinators

### 4. Monitor
**Badge Color**: Gray (`#f3f4f6` / `#374151`)

**Permissions**:
- ❌ Cannot create delegations
- ✅ View all delegations (read-only)
- ✅ View all protocol documents
- ❌ Cannot sign delegations
- ✅ Export logs and reports

**Use Case**: CRO monitors, Sponsor representatives

### 5. Viewer
**Badge Color**: Gray (`#f3f4f6` / `#374151`)

**Permissions**:
- ❌ Cannot create delegations
- ✅ View delegations (read-only)
- ✅ View protocol documents (read-only)
- ❌ Cannot sign delegations
- ❌ Cannot upload or modify documents

**Use Case**: Auditors, Regulatory staff, Read-only access

## User Profile Display

### Location
User profile appears in the left sidebar above the menu:

```
┌─────────────────────────┐
│ David Taylor            │
│ david@example.com       │
│                         │
│ [SITE ADMIN] [🏥 Site] │
│ [Sign Out]              │
└─────────────────────────┘
```

### Information Displayed
1. **Display Name** - From Azure AD or database
2. **Email** - User's email address
3. **Role Badge** - Color-coded role indicator
4. **Client Badge** - Organization name
5. **Sign Out Button** - Logout action

### Role Badge Styling

The role badge uses:
- Uppercase text
- Small font (11px)
- Bold weight (600)
- Rounded corners
- Color-coded background and text

Example rendering:
```tsx
<span style={{
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  backgroundColor: roleColor.bg,
  color: roleColor.text
}}>
  {displayRole}
</span>
```

## Backend Integration

### User Profile Endpoint
```http
GET /api/v1/user/profile
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "id": "uuid",
  "azureAdUserId": "azure-ad-oid",
  "email": "user@example.com",
  "displayName": "User Name",
  "role": "coordinator",
  "clientId": "client-uuid",
  "client": {
    "name": "Research Site Name",
    "organizationType": "research_site"
  },
  "lastLogin": "2025-11-26T10:00:00Z"
}
```

### Database Schema
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    azure_ad_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    client_id UUID REFERENCES clients(id),
    role VARCHAR(50) CHECK (role IN (
        'site_admin',
        'coordinator', 
        'investigator',
        'monitor',
        'viewer'
    )),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## User Context Implementation

### React Context
The `UserContext` manages user state globally:

```typescript
interface UserProfile {
  id: string;
  azureAdUserId: string;
  email: string;
  displayName: string;
  role: 'site_admin' | 'coordinator' | 'investigator' | 'monitor' | 'viewer';
  clientId: string;
  client: {
    name: string;
    organizationType: string;
  };
  lastLogin?: string;
}
```

### Usage in Components
```typescript
import { useUser } from '../contexts/UserContext';

const MyComponent = () => {
  const { user, loading, error } = useUser();
  
  // Check role
  const canDelegate = user?.role === 'site_admin' || user?.role === 'investigator';
  
  // Display user info
  return <div>{user?.displayName}</div>;
};
```

## Setting Up User Roles

### Step 1: Create User in Database
```sql
INSERT INTO users (
    azure_ad_user_id,
    email,
    display_name,
    client_id,
    role
)
VALUES (
    'azure-ad-object-id',  -- From Azure AD oid claim
    'user@example.com',
    'User Name',
    'client-uuid',
    'coordinator'  -- Choose: site_admin, investigator, coordinator, monitor, viewer
);
```

### Step 2: Get Azure AD Object ID

1. User signs in via Azure AD
2. Check browser console for user info:
```javascript
console.log('[UserContext] Account info:', {
  username: accounts[0].username,
  localAccountId: accounts[0].localAccountId  // This is the oid
});
```

3. Use this ID in the database insert above

### Step 3: Verify Role Display

1. Refresh portal
2. User profile should show:
   - Correct role badge with color
   - Organization name
   - Email and display name

## Troubleshooting

### Issue: Role shows "No Role"

**Cause**: User record not in database or role field is NULL

**Solution**:
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'user@example.com';

-- Add or update role
UPDATE users 
SET role = 'coordinator',
    display_name = 'User Name'
WHERE email = 'user@example.com';
```

### Issue: "Profile not configured" error

**Cause**: Azure AD user has no corresponding database record

**Solution**: Create user record with correct `azure_ad_user_id` (oid from Azure AD)

### Issue: Role badge shows wrong color

**Cause**: Role value doesn't match expected values

**Solution**: Check role value matches exactly:
- `site_admin` (not `Site Admin` or `siteadmin`)
- `coordinator` (not `Coordinator`)
- All lowercase with underscore

### Issue: User sees features they shouldn't access

**Cause**: Frontend permission check failing

**Solution**: Verify role-based logic:
```typescript
// Correct
const canDelegate = user?.role === 'site_admin' || user?.role === 'investigator';

// In component
{canDelegate && <button>Create Delegation</button>}
```

## Feature Access Matrix

| Feature | site_admin | investigator | coordinator | monitor | viewer |
|---------|-----------|--------------|-------------|---------|--------|
| **Dashboard** | Full | Full | Full | Full | Read-only |
| **Protocol Versions** | Full | Full | View | View | View |
| **Upload Documents** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Set Current Status** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create Delegation** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View All Delegations** | ✅ | ✅ | Own only | ✅ | ✅ |
| **Sign Delegation** | ✅* | ✅* | ✅* | ❌ | ❌ |
| **Document Query (Chat)** | ✅ | ✅ | ✅ | ✅ | ✅ |

*Only when delegation is assigned to them

## Role Change Workflow

### Promoting a User

1. **Database update**:
```sql
UPDATE users 
SET role = 'investigator',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com';
```

2. **User must re-login** to refresh JWT token and profile

3. **Verify new permissions** work correctly

### Best Practices

1. **Principle of Least Privilege**: Assign minimum necessary role
2. **Regular Audits**: Review user roles quarterly
3. **Separation of Duties**: Don't give everyone site_admin
4. **Document Changes**: Log role changes in audit trail
5. **Training Required**: Ensure users understand their role responsibilities

## Compliance Considerations

### FDA 21 CFR Part 11

Role-based access control supports:
- **§11.10(d)**: Limiting system access to authorized individuals
- **§11.10(g)**: Authority checks to ensure appropriate user privileges
- **§11.300(b)**: Unique user identification

### GCP Guidelines

Roles align with ICH-GCP E6(R2) responsibilities:
- **Principal Investigator**: Full oversight (investigator role)
- **Delegation of Tasks**: Documented in DOA log (all roles)
- **Training & Qualification**: Verified before role assignment

## Related Documentation

- [Delegation Log](./DELEGATION_LOG.md) - Role-based delegation features
- [Azure Setup](./AZURE_SETUP.md) - Authentication configuration
- [Multi-Tenancy](./MULTI_TENANT_SETUP.md) - Client isolation by role

## Summary

The user role system provides granular access control while maintaining ease of use. Roles are:
- **Clearly defined** with specific permissions
- **Visually distinct** with color-coded badges
- **Compliance-aligned** with FDA and GCP requirements
- **Flexible** for various organizational structures

Users always know their role and permissions through the persistent profile display in the sidebar.

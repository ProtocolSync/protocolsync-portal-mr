# Portal API Integration Guide

This guide shows how to use the new centralized API service in the portal.

## Quick Start

The portal now has a centralized API service that automatically handles:
- API key authentication
- Session management
- JWT token handling
- Error handling

## Import the API Service

```typescript
import api from './api';
```

## Basic Usage

### Making API Requests

All requests automatically include the API key from environment variables:

```typescript
// GET request
const response = await api.get('/companies');
if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}

// POST request
const response = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
await api.put(`/users/${userId}`, { name: 'Jane Doe' });

// DELETE request
await api.delete(`/users/${userId}`);
```

### File Uploads

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'Document Title');

const response = await api.upload('/documents/upload', formData);
if (response.success) {
  console.log('Uploaded:', response.data);
}
```

## Authentication

### Login with Email/Password

```typescript
import api from './api';

const handleLogin = async (email: string, password: string) => {
  const result = await api.session.login(email, password);
  
  if (result.success) {
    console.log('Logged in as:', result.data.user);
    // Session ID is automatically stored and used for future requests
  } else {
    console.error('Login failed:', result.error);
  }
};
```

### Login with Azure AD

```typescript
import { useMsal } from '@azure/msal-react';
import api from './api';

const LoginWithAzure = () => {
  const { instance } = useMsal();
  
  const handleAzureLogin = async () => {
    try {
      // Get Azure AD token
      const result = await instance.loginPopup({
        scopes: ['User.Read']
      });
      
      // Exchange for session
      const sessionResult = await api.session.loginWithJWT(result.accessToken);
      
      if (sessionResult.success) {
        console.log('Logged in:', sessionResult.data.user);
        // Navigate to dashboard
      }
    } catch (error) {
      console.error('Azure login failed:', error);
    }
  };
  
  return <button onClick={handleAzureLogin}>Sign in with Microsoft</button>;
};
```

### Check Session Status

```typescript
const checkAuth = async () => {
  const result = await api.session.check();
  
  if (result.success && result.data.valid) {
    console.log('User is authenticated:', result.data.user);
    return true;
  } else {
    console.log('Not authenticated');
    return false;
  }
};
```

### Logout

```typescript
const handleLogout = async () => {
  await api.session.logout();
  // Redirect to login page
  window.location.href = '/login';
};
```

## Example: Complete User Profile Component

```typescript
import { useEffect, useState } from 'react';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
}

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const response = await api.get('/profile/me');
    
    if (response.success) {
      setUser(response.data);
    } else {
      setError(response.error || 'Failed to load profile');
    }
    
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const response = await api.put('/profile/me', updates);
    
    if (response.success) {
      setUser(response.data);
      alert('Profile updated!');
    } else {
      alert('Update failed: ' + response.error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user data</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={() => updateProfile({ name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
};

export default UserProfile;
```

## Example: Document Upload Component

```typescript
import { useState } from 'react';
import api from './api';

const DocumentUpload = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('description', 'Uploaded via portal');

    const response = await api.upload('/documents/upload', formData);

    if (response.success) {
      alert('Document uploaded successfully!');
      console.log('Document:', response.data);
    } else {
      alert('Upload failed: ' + response.error);
    }

    setUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
};

export default DocumentUpload;
```

## Example: Companies List with Billing

```typescript
import { useEffect, useState } from 'react';
import api from './api';

const CompaniesList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const response = await api.get('/companies');
    
    if (response.success) {
      setCompanies(response.data);
    }
    
    setLoading(false);
  };

  const loadCompanyBilling = async (companyId: string) => {
    const response = await api.get(`/companies/${companyId}/subscription`);
    
    if (response.success) {
      console.log('Billing info:', response.data);
    }
  };

  if (loading) return <div>Loading companies...</div>;

  return (
    <div>
      <h1>Companies</h1>
      <ul>
        {companies.map((company: any) => (
          <li key={company.id}>
            {company.name}
            <button onClick={() => loadCompanyBilling(company.id)}>
              View Billing
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompaniesList;
```

## Migrating Existing Code

### Before (Manual Fetch)

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL;

const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

### After (Using API Service)

```typescript
import api from './api';

const response = await api.get(`/companies/${id}`);

if (response.success) {
  const data = response.data;
}
```

## Error Handling

The API service provides consistent error handling:

```typescript
const response = await api.get('/some-endpoint');

if (!response.success) {
  // Handle error
  console.error('API Error:', response.error);
  
  // Show user-friendly message
  alert(`Failed: ${response.error}`);
  
  return;
}

// Success - use data
const data = response.data;
```

## Advanced Options

### Custom Headers

```typescript
const response = await api.get('/endpoint', {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Disable API Key (for public endpoints)

```typescript
const response = await api.get('/health', {
  includeApiKey: false
});
```

### Disable Authentication

```typescript
const response = await api.get('/public-data', {
  includeAuth: false
});
```

## Configuration Check

Verify your API is properly configured:

```typescript
import { isApiKeyConfigured, getApiConfig } from './api';

if (!isApiKeyConfigured()) {
  console.error('API Key not configured! Set VITE_API_KEY in .env');
}

const config = getApiConfig();
console.log('API Config:', config);
// { baseUrl: "http://localhost:3000/api/v1", hasApiKey: true }
```

## Best Practices

1. **Always check response.success** before using data
2. **Handle errors gracefully** - show user-friendly messages
3. **Use TypeScript interfaces** for response types
4. **Don't expose API keys** in client code (use env variables)
5. **Implement loading states** for better UX
6. **Add retry logic** for critical operations
7. **Cache responses** when appropriate

## TypeScript Support

Define response types for better type safety:

```typescript
interface Company {
  id: string;
  name: string;
  status: string;
}

// Type-safe API call
const response = await api.get<Company[]>('/companies');

if (response.success) {
  // response.data is typed as Company[]
  response.data.forEach(company => {
    console.log(company.name);
  });
}
```

## Troubleshooting

### "API key required" error

Make sure `VITE_API_KEY` is set in `.env`:

```env
VITE_API_KEY=ps_your_api_key_here
```

Restart the dev server after changing `.env` files.

### CORS errors

Check that the API has your portal URL in `FRONTEND_URL`:

```env
# In API .env
FRONTEND_URL=http://localhost:5173
```

### Session expired errors

Re-authenticate using `api.session.login()` or `api.session.loginWithJWT()`.

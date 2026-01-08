# Monorepo Foundation Setup - 1 Day
## Get Web + Mobile-Ready in a Single Day

**Timeline**: ~6-8 hours  
**Goal**: Create unified monorepo foundation, refactor web app to use shared packages, ready for mobile development

---

## Prerequisites (30 minutes before you start)

### Required Tools
- Node 22+
- npm 7+ (has workspace support)
- Git
- Your existing protocolsync-portal code

### Quick Setup Check
```bash
node --version        # Should be 22+
npm --version         # Should be 7+
git --version
```

---

## Step 1: Create Monorepo Root (15 minutes)

### 1.1 Create Directory Structure
```bash
# Create new monorepo directory
mkdir ~/Documents/Projects/protocolsync-monorepo
cd ~/Documents/Projects/protocolsync-monorepo

# Create workspace directories
mkdir apps packages
```

### 1.2 Copy Existing Web App
```bash
# Copy portal into apps/portal-web
cp -r ~/Documents/Projects/protocolsync-portal apps/portal-web

# Verify it's there
ls -la apps/portal-web/package.json
```

### 1.3 Create Root package.json
```bash
cat > package.json << 'EOF'
{
  "name": "@protocolsync/monorepo",
  "version": "1.0.0",
  "description": "ProtocolSync - Unified Web & Mobile",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev:web": "turbo run dev --filter=portal-web",
    "dev:mobile": "turbo run dev --filter=mobile"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
EOF
```

### 1.4 Create turbo.json
```bash
cat > turbo.json << 'EOF'
{
  "version": "1",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": ["dist/**", "build/**"],
      "cache": false
    }
  }
}
EOF
```

### 1.5 Install Dependencies
```bash
npm install
# This will install turbo and set up workspaces
```

**✅ Checkpoint**: Root monorepo created with web app in place

---

## Step 2: Extract Shared Packages (2.5 hours)

### 2.1 Create shared-types Package

```bash
mkdir -p packages/shared-types/src

cat > packages/shared-types/package.json << 'EOF'
{
  "name": "@protocolsync/shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
EOF

cat > packages/shared-types/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

**Extract types** from existing app's `src/types` or `src/models`:

```bash
cat > packages/shared-types/src/user.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company: Company;
  roles: Role[];
  activeRole: Role;
  lastLogin: Date;
}

export interface Company {
  id: string;
  name: string;
  subscription: string;
}

export enum Role {
  CRO_ADMIN = 'cro_admin',
  SITE_ADMIN = 'site_admin',
  TRIAL_LEAD = 'trial_lead',
  SITE_USER = 'site_user',
}
EOF

cat > packages/shared-types/src/dashboard.ts << 'EOF'
export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalAdmins: number;
  totalUsers: number;
  subscriptionStatus: string;
  nextBillingDate: string;
}

export interface SiteListItem {
  id: string;
  siteName: string;
  status: 'active' | 'inactive';
}
EOF

cat > packages/shared-types/src/api.ts << 'EOF'
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListRequest {
  pagination?: { page: number; perPage: number };
  sort?: { field: string; order: 'ASC' | 'DESC' };
  filter?: Record<string, any>;
  meta?: Record<string, any>;
}
EOF

cat > packages/shared-types/src/index.ts << 'EOF'
export * from './user';
export * from './dashboard';
export * from './api';
EOF

# Build it
cd packages/shared-types && npm install && npm run build && cd ../..
```

### 2.2 Create shared-constants Package

```bash
mkdir -p packages/shared-constants/src

cat > packages/shared-constants/package.json << 'EOF'
{
  "name": "@protocolsync/shared-constants",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@protocolsync/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
EOF

cat > packages/shared-constants/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/shared-constants/src/api.ts << 'EOF'
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
  },
  SITES: {
    LIST: '/sites',
    GET: (id: string) => `/sites/${id}`,
  },
  SITE_ADMINS: {
    LIST: '/site-administrators',
    GET: (id: string) => `/site-administrators/${id}`,
  },
};

export const API_CONFIG = {
  VERSION: 'v1',
  TIMEOUT: 30000,
};

export const getApiBaseUrl = (): string => {
  return process.env.REACT_APP_API_BASE_URL || 'https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net';
};
EOF

cat > packages/shared-constants/src/roles.ts << 'EOF'
import { Role } from '@protocolsync/shared-types';

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'CRO Administrator',
  [Role.SITE_ADMIN]: 'Site Administrator',
  [Role.TRIAL_LEAD]: 'Trial Lead',
  [Role.SITE_USER]: 'Site User',
};
EOF

cat > packages/shared-constants/src/index.ts << 'EOF'
export * from './api';
export * from './roles';
EOF

cd packages/shared-constants && npm install && npm run build && cd ../..
```

### 2.3 Create shared-utils Package

```bash
mkdir -p packages/shared-utils/src

cat > packages/shared-utils/package.json << 'EOF'
{
  "name": "@protocolsync/shared-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@protocolsync/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
EOF

cat > packages/shared-utils/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/shared-utils/src/validation.ts << 'EOF'
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  return { valid: errors.length === 0, errors };
};
EOF

cat > packages/shared-utils/src/formatters.ts << 'EOF'
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US');
};

export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};
EOF

cat > packages/shared-utils/src/index.ts << 'EOF'
export * from './validation';
export * from './formatters';
EOF

cd packages/shared-utils && npm install && npm run build && cd ../..
```

### 2.4 Create shared-services Package

```bash
mkdir -p packages/shared-services/src

cat > packages/shared-services/package.json << 'EOF'
{
  "name": "@protocolsync/shared-services",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@protocolsync/shared-types": "workspace:*",
    "@protocolsync/shared-constants": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
EOF

cat > packages/shared-services/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/shared-services/src/api/ApiClient.ts << 'EOF'
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  getToken: () => Promise<string>;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private getToken: () => Promise<string>;
  
  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.getToken = config.getToken;
  }
  
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  private async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...init?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
}
EOF

cat > packages/shared-services/src/auth/IAuthService.ts << 'EOF'
import { User } from '@protocolsync/shared-types';

export interface IAuthService {
  login(): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): Promise<string>;
  isAuthenticated(): boolean | Promise<boolean>;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  expiresIn: number;
}
EOF

cat > packages/shared-services/src/index.ts << 'EOF'
export { ApiClient } from './api/ApiClient';
export type { IAuthService, AuthResponse } from './auth/IAuthService';
EOF

cd packages/shared-services && npm install && npm run build && cd ../..
```

### 2.5 Create shared-hooks Package

```bash
mkdir -p packages/shared-hooks/src

cat > packages/shared-hooks/package.json << 'EOF'
{
  "name": "@protocolsync/shared-hooks",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@protocolsync/shared-types": "workspace:*",
    "@protocolsync/shared-services": "workspace:*",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
EOF

cat > packages/shared-hooks/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/shared-hooks/src/useLogin.ts << 'EOF'
import { useState } from 'react';

export const useLogin = (onLogin: () => Promise<void>) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    
    try {
      await onLogin();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return { isLoggingIn, error, handleLogin };
};
EOF

cat > packages/shared-hooks/src/useDashboard.ts << 'EOF'
import { useState, useEffect } from 'react';
import { DashboardStats } from '@protocolsync/shared-types';

export const useDashboard = (
  onFetch: () => Promise<DashboardStats>,
  deps?: any[]
) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetch = async () => {
      try {
        setError(null);
        const data = await onFetch();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetch();
  }, deps || []);
  
  return { stats, isLoading, error };
};
EOF

cat > packages/shared-hooks/src/index.ts << 'EOF'
export { useLogin } from './useLogin';
export { useDashboard } from './useDashboard';
EOF

cd packages/shared-hooks && npm install && npm run build && cd ../..
```

**✅ Checkpoint**: All 5 shared packages created and built

---

## Step 3: Update Web App to Use Shared Packages (1.5 hours)

### 3.1 Update Web App package.json

```bash
cd apps/portal-web

# Add shared packages as dependencies
npm install @protocolsync/shared-types@workspace:* \
            @protocolsync/shared-constants@workspace:* \
            @protocolsync/shared-utils@workspace:* \
            @protocolsync/shared-services@workspace:* \
            @protocolsync/shared-hooks@workspace:*
```

### 3.2 Convert Login Component to .web.tsx

```bash
# Rename existing Login component
mv src/components/Login.tsx src/components/Login.web.tsx

# Create export wrapper
cat > src/components/Login.tsx << 'EOF'
export { Login } from './Login.web';
EOF
```

### 3.3 Update Login.web.tsx to Use Shared Hooks

Edit `apps/portal-web/src/components/Login.web.tsx`:

Replace the business logic section with:
```typescript
// At the top, add import:
import { useLogin } from '@protocolsync/shared-hooks';

// In the component, replace login logic:
export const Login = () => {
  const { instance } = useMsal();
  const { error: contextError } = useUser();
  
  // Use shared hook
  const { isLoggingIn, error, handleLogin } = useLogin(async () => {
    const response = await instance.loginPopup(loginRequest);
    if (response.account) {
      instance.setActiveAccount(response.account);
    }
  });

  // Rest of component uses { isLoggingIn, error, handleLogin }
  // (no changes needed to the JSX)
};
```

### 3.4 Convert CROAdminDashboard Component

```bash
# Rename
mv src/components/CROAdminDashboard.tsx src/components/CROAdminDashboard.web.tsx

# Create export wrapper
cat > src/components/CROAdminDashboard.tsx << 'EOF'
export { CROAdminDashboard } from './CROAdminDashboard.web';
EOF
```

Edit `src/components/CROAdminDashboard.web.tsx`:

```typescript
// At top, add import:
import { useDashboard } from '@protocolsync/shared-hooks';

// In component, replace data fetching with:
export const CROAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Use shared hook - replace your useGetList calls with:
  const { stats, isLoading, error } = useDashboard(
    async () => {
      const sites = await fetch(`/api/sites?company_id=${user?.company?.id}`).then(r => r.json());
      const admins = await fetch(`/api/site-administrators?company_id=${user?.company?.id}`).then(r => r.json());
      const users = await fetch(`/api/users?company_id=${user?.company?.id}`).then(r => r.json());
      
      return {
        totalSites: sites.length,
        activeSites: sites.filter((s: any) => s.status === 'active').length,
        totalAdmins: admins.length,
        totalUsers: users.length,
        subscriptionStatus: 'active',
        nextBillingDate: new Date().toISOString(),
      };
    },
    [user?.company?.id]
  );

  if (isLoading) return <CSpinner />;

  // Rest of component uses { stats, isLoading, error }
  // (JSX stays the same, just uses stats instead of calculated values)
};
```

### 3.5 Test Web App

```bash
cd apps/portal-web

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Run dev server
npm run dev
# Should start on http://localhost:5173
```

**Verify**:
- ✅ App builds without errors
- ✅ Login flow works
- ✅ Dashboard loads and displays stats
- ✅ No console errors

**✅ Checkpoint**: Web app refactored and working with shared packages

---

## Step 4: Verify Monorepo Works (30 minutes)

### 4.1 Run from Root

```bash
cd ~/Documents/Projects/protocolsync-monorepo

# Should run web dev server
npm run dev:web
```

### 4.2 Build All

```bash
npm run build
# Should build web + all packages
```

### 4.3 Verify Structure

```bash
tree -L 2 -I 'node_modules'
```

Should show:
```
.
├── apps/
│   └── portal-web/
├── packages/
│   ├── shared-constants/
│   ├── shared-hooks/
│   ├── shared-services/
│   ├── shared-types/
│   └── shared-utils/
├── package.json
├── turbo.json
└── tsconfig.json
```

**✅ Checkpoint**: Monorepo foundation complete!

---

## Done! What You Now Have

✅ **Unified monorepo** with 5 shared packages  
✅ **Web app refactored** to use shared hooks and types  
✅ **Ready for mobile** - just add React Native components  
✅ **TypeScript strict mode** throughout  
✅ **Turborepo orchestration** for building both platforms  

---

## Next: Add Mobile (Optional, Can Do Later)

When ready to add mobile:

```bash
# Create mobile app (skip for now if not ready)
cd apps
npx create-expo-app mobile
cd mobile
npm install @protocolsync/shared-types@workspace:* \
            @protocolsync/shared-hooks@workspace:*
```

Then create:
- `apps/mobile/src/screens/Login.native.tsx` - Uses same `useLogin()` hook
- `apps/mobile/src/screens/CROAdminDashboard.native.tsx` - Uses same `useDashboard()` hook

Same business logic, different UI components (React Native instead of CoreUI).

---

## Troubleshooting

**"Cannot find module '@protocolsync/shared-types'"**
```bash
# Make sure you installed packages as workspace dependencies
npm install

# Then rebuild from root
npm run build
```

**"Web app won't start"**
```bash
cd apps/portal-web
rm -rf node_modules dist
npm install
npm run dev
```

**"TypeScript errors in packages"**
```bash
cd packages/shared-types
npm run build  # Should show actual error
```

---

## You're Done! 🎉

**Time elapsed**: ~6-8 hours  
**What's ready**: Monorepo foundation + web app refactored  
**What's next**: Build mobile screens as needed using same hooks

All the detailed architecture docs in `/docs` are there for reference, but this is all you need to get started!


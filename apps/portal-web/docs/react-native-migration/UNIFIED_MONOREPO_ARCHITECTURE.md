# ProtocolSync Unified Monorepo Architecture
## Single Codebase, Multiple Platforms (Web + React Native)

**Status**: Architecture Design Document  
**Date**: January 2026  
**Goal**: Build web (React Admin/CoreUI) and mobile (React Native) from one monorepo, sharing business logic while having platform-specific views.

---

## ⚡ Quick Start: Setup in 1 Day

**TL;DR**: You can get the monorepo foundation ready in **6-8 hours** (not 9 weeks).

See **[MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md)** for copy-paste commands to:
1. Create monorepo structure
2. Extract 5 shared packages (types, constants, utils, services, hooks)
3. Refactor web app to use shared packages
4. Test everything works

**Result**: Web app refactored + ready for mobile. Mobile screens can be added incrementally.

---

## Executive Summary

### The Strategy
**Write business logic once, template the UI for each platform.**

- **Shared**: All hooks, services, types, API clients, validation, business logic
- **Platform-Specific**: Only the view layer (CoreUI components for web, React Native components for mobile)
- **Build**: Turborepo orchestrates separate builds for web and mobile from one codebase

### Key Benefits
✅ **No duplicate business logic** - Dashboard stats, user fetching, permissions calculated once  
✅ **Faster mobile development** - Reuse ~70% of non-UI code  
✅ **Single source of truth** - Types, API calls, auth flow defined once  
✅ **Unified CI/CD** - One monorepo, multiple deployment targets  
✅ **Incremental migration** - Refactor web first, then add mobile

---

## Current State vs Proposed State

### Current (Separate Projects)
```
protocolsync-api/
protocolsync-portal/          ← React Admin + CoreUI (web only)
protocolsync-website/
protocolsync-admin/
protocolsync-shared-styles/   ← SCSS only
```

**Problem**: Mobile version would require rebuilding all business logic, hooks, auth, API integrations from scratch.

### Proposed (Unified Monorepo)
```
protocolsync/                                    (root)
├── apps/
│   ├── portal-web/                            (existing React + Vite + React Admin)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Login.web.tsx              (CoreUI view)
│   │   │   │   ├── CROAdminDashboard.web.tsx  (CoreUI + DataGrid view)
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   │
│   └── mobile/                                 (new React Native app)
│       ├── src/
│       │   ├── screens/
│       │   │   ├── Login.native.tsx            (React Native view)
│       │   │   ├── CROAdminDashboard.native.tsx (FlatList view)
│       │   ├── navigation/
│       │   └── App.tsx
│       └── metro.config.js
│
├── packages/                                   (SHARED WORKSPACE)
│   ├── shared-hooks/                          (Custom React hooks - business logic)
│   │   ├── useLogin.ts
│   │   ├── useCROAdminDashboard.ts
│   │   ├── useFetchData.ts
│   │   └── index.ts
│   │
│   ├── shared-services/                       (API clients, auth, business operations)
│   │   ├── auth/
│   │   │   ├── AuthService.ts                 (interface)
│   │   │   ├── msal.config.ts
│   │   │   └── tokenManager.ts
│   │   ├── api/
│   │   │   ├── apiClient.ts                   (Axios/Fetch wrapper)
│   │   │   ├── endpoints.ts
│   │   │   └── errorHandler.ts
│   │   ├── dashboard/
│   │   │   └── dashboardService.ts
│   │   └── index.ts
│   │
│   ├── shared-types/                          (TypeScript interfaces & types)
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── dashboard.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   │
│   ├── shared-constants/                      (Config, enums, constants)
│   │   ├── apiEndpoints.ts
│   │   ├── roles.ts
│   │   ├── permissions.ts
│   │   └── index.ts
│   │
│   ├── shared-utils/                          (Validation, formatting, helpers)
│   │   ├── validation.ts
│   │   ├── formatters.ts
│   │   └── index.ts
│   │
│   └── shared-styles/                         (Design tokens as JS objects)
│       ├── tokens.ts                          (Colors, spacing, typography)
│       ├── theme.ts
│       └── index.ts
│
├── turbo.json                                  (Turborepo config)
├── package.json                                (Root workspace config)
└── README.md
```

---

## Architecture Layers

### Layer 1: Shared Business Logic (Reusable across platforms)
**Location**: `packages/`

#### `packages/shared-hooks/`
Custom React hooks that encapsulate business logic. **No UI dependency.**

```typescript
// packages/shared-hooks/useLogin.ts
export const useLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await authService.login();
      return response;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return { isLoggingIn, error, handleLogin };
};

// packages/shared-hooks/useCROAdminDashboard.ts
export const useCROAdminDashboard = () => {
  const { user } = useUser();
  
  const { data: sites } = useGetList('sites', {
    pagination: { page: 1, perPage: 1000 },
    meta: { companyId: user?.company?.id }
  }, { enabled: !!user?.company?.id });
  
  const { data: admins } = useGetList('site-administrators', { ... });
  const { data: users } = useGetList('users', { ... });
  
  const stats = useMemo(() => ({
    totalSites: sites?.length || 0,
    activeSites: sites?.filter(s => s.status === 'active').length || 0,
    totalAdmins: admins?.length || 0,
    totalUsers: users?.length || 0,
  }), [sites, admins, users]);
  
  return { stats, isLoading: sitesLoading || adminsLoading || usersLoading };
};
```

Both web and mobile consume these hooks **identically**—no platform-specific code needed.

#### `packages/shared-services/`
Services that handle API calls, auth, business operations.

```typescript
// packages/shared-services/api/apiClient.ts
export const createApiClient = (getToken: () => Promise<string>) => {
  return {
    get: async (url: string) => {
      const token = await getToken();
      return fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    // ... post, put, delete
  };
};

// packages/shared-services/auth/AuthService.ts
export interface IAuthService {
  login(): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): Promise<string>;
  isAuthenticated(): boolean;
}

// Web implementation: packages/shared-services/auth/MsalAuthService.ts
export const createMsalAuthService = (msalInstance): IAuthService => {
  return { /* MSAL-specific implementation */ };
};

// Mobile implementation: packages/shared-services/auth/MobileAuthService.ts
export const createMobileAuthService = (storage): IAuthService => {
  return { /* AsyncStorage + OAuth flow */ };
};
```

#### `packages/shared-types/`
All TypeScript interfaces—consumed by both platforms.

```typescript
// packages/shared-types/api.ts
export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalAdmins: number;
  totalUsers: number;
  subscriptionStatus: string;
  nextBillingDate: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  company: Company;
  roles: Role[];
}

// Used in both web and mobile without modification
```

#### `packages/shared-utils/`, `packages/shared-constants/`
Validation schemas, formatting functions, API endpoints, enum definitions—no UI code.

### Layer 2: Platform-Specific Views
**Location**: `apps/portal-web/` and `apps/mobile/`

#### Web Views (CoreUI + React Admin)
```typescript
// apps/portal-web/src/components/Login.web.tsx
import { useLogi from '@protocolsync/shared-hooks';
import { CButton, CCard, CSpinner } from '@coreui/react';

export const Login = () => {
  const { isLoggingIn, error, handleLogin } = useLogin();
  
  return (
    <div className="bg-body-tertiary min-vh-100">
      <CCard className="p-4">
        <h1>Login</h1>
        {error && <CAlert color="danger">{error}</CAlert>}
        <CButton 
          onClick={handleLogin} 
          disabled={isLoggingIn}
          style={{ backgroundColor: '#005C4D' }}
        >
          {isLoggingIn ? <CSpinner size="sm" /> : 'Sign in'}
        </CButton>
      </CCard>
    </div>
  );
};

// apps/portal-web/src/components/CROAdminDashboard.web.tsx
import { useCROAdminDashboard } from '@protocolsync/shared-hooks';
import { Card, CardHeader, CardContent } from './Card';
import { CRow, CCol, CButton, CSpinner } from '@coreui/react';

export const CROAdminDashboard = () => {
  const { stats, isLoading } = useCROAdminDashboard();
  const navigate = useNavigate();
  
  if (isLoading) return <CSpinner />;
  
  return (
    <div className="p-4">
      <Card className="mb-4">
        <CardHeader>
          <h2>Overview Statistics</h2>
        </CardHeader>
        <CardContent>
          <CRow className="g-4">
            <CCol md={6} lg={3}>
              <div className="p-4 border rounded">
                <p>Total Sites</p>
                <p className="display-4">{stats.totalSites}</p>
              </div>
            </CCol>
            {/* ... other stat cards ... */}
          </CRow>
        </CardContent>
      </Card>
    </div>
  );
};
```

#### Mobile Views (React Native)
```typescript
// apps/mobile/src/screens/Login.native.tsx
import { useLogin } from '@protocolsync/shared-hooks';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Login = () => {
  const { isLoggingIn, error, handleLogin } = useLogin();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          Login
        </Text>
        {error && <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoggingIn}
          style={{
            backgroundColor: '#005C4D',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sign in</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// apps/mobile/src/screens/CROAdminDashboard.native.tsx
import { useCROAdminDashboard } from '@protocolsync/shared-hooks';
import { View, FlatList, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CROAdminDashboard = () => {
  const { stats, isLoading } = useCROAdminDashboard();
  const navigation = useNavigation();
  
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  
  const statCards = [
    { label: 'Total Sites', value: stats.totalSites },
    { label: 'Site Admins', value: stats.totalAdmins },
    { label: 'Total Users', value: stats.totalUsers },
  ];
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          CRO Admin Dashboard
        </Text>
        
        <FlatList
          data={statCards}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold' }}>
                {item.value}
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
};
```

### Layer 3: Platform Exports
```typescript
// apps/portal-web/src/components/Login.tsx
export { Login } from './Login.web';  // Webpack/Vite uses .web.tsx

// apps/mobile/src/screens/Login.tsx
export { Login } from './Login.native';  // Metro uses .native.tsx

// Usage is identical in both:
// import { Login } from './Login';  // Correct file loaded automatically
```

---

## File Naming Conventions

### Platform-Specific Files
Use extensions to signal which platform a file targets:

| Extension | Platform | Bundler |
|-----------|----------|---------|
| `.web.tsx` / `.web.ts` | React (web) | Webpack, Vite, Rollup |
| `.native.tsx` / `.native.ts` | React Native | Metro, Expo |
| `.tsx` / `.ts` | Shared (export only) | Both |

### Examples
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.web.tsx       (CoreUI Button)
│   │   ├── Button.native.tsx     (React Native TouchableOpacity)
│   │   └── Button.tsx            (export { Button } from './Button.web')
│   │
│   ├── Card/
│   │   ├── Card.web.tsx          (HTML div + Bootstrap)
│   │   ├── Card.native.tsx        (React Native View)
│   │   └── Card.tsx              (export)
│
├── hooks/
│   ├── useLogin.ts               (✓ Shared - no platform dependencies)
│   ├── useDashboard.ts           (✓ Shared)
│   ├── useNavigation.web.ts       (Router v6 - web only)
│   └── useNavigation.native.ts    (React Navigation - RN only)
│
├── services/
│   ├── api/
│   │   └── apiClient.ts          (✓ Shared - fetch/axios wrapper)
│   ├── auth/
│   │   ├── AuthService.ts        (✓ Interface definition)
│   │   ├── msal.ts               (Web: MSAL React)
│   │   └── oauth.ts              (Mobile: AsyncStorage + OAuth)
│
└── utils/
    ├── validation.ts             (✓ Shared)
    ├── formatters.ts             (✓ Shared)
    ├── storage.web.ts            (localStorage)
    └── storage.native.ts         (AsyncStorage)
```

---

## Build System: Turborepo

Turborepo orchestrates the monorepo—running builds, tests, and deploys for both platforms efficiently.

### Root `turbo.json`
```json
{
  "version": "1",
  "tasks": {
    "build": {
      "outputs": ["dist/**", "build/**"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Commands
```bash
# Build everything (web + mobile + shared packages)
npm run build

# Build only web
npm run build --filter=portal-web

# Build only mobile
npm run build --filter=mobile

# Develop (watch mode for all packages)
npm run dev

# Develop only web
npm run dev --filter=portal-web

# Run tests across all packages
npm run test

# Lint everything
npm run lint
```

---

## Dependency Graph

```
apps/mobile
  ├── depends on → packages/shared-hooks
  ├── depends on → packages/shared-services
  ├── depends on → packages/shared-types
  ├── depends on → packages/shared-constants
  ├── depends on → packages/shared-utils
  └── depends on → react-native, expo, @react-navigation, etc.

apps/portal-web
  ├── depends on → packages/shared-hooks
  ├── depends on → packages/shared-services
  ├── depends on → packages/shared-types
  ├── depends on → packages/shared-constants
  ├── depends on → packages/shared-utils
  ├── depends on → packages/shared-styles (if reusing design tokens)
  └── depends on → react, react-admin, @coreui/react, etc.

packages/shared-hooks
  ├── depends on → packages/shared-services
  ├── depends on → packages/shared-types
  └── depends on → react, @azure/msal-react (optional, for useUser)

packages/shared-services
  ├── depends on → packages/shared-types
  ├── depends on → packages/shared-constants
  ├── depends on → packages/shared-utils
  └── depends on → axios, @azure/msal-browser, etc.

packages/shared-types
  └── (No dependencies - pure TypeScript)

packages/shared-constants
  └── (No dependencies)

packages/shared-utils
  └── depends on → packages/shared-types (for type checking)
```

---

## Key Principles

### 1. **No Platform-Specific Code in Shared Packages**
❌ **Bad**: Importing React DOM or React Native in shared packages
```typescript
// ❌ WRONG - in packages/shared-hooks
import { Button } from '@coreui/react';

export const useMyHook = () => {
  return <Button>Click</Button>;  // Don't do this!
};
```

✅ **Good**: Only return data/callbacks from hooks
```typescript
// ✅ CORRECT
export const useMyHook = () => {
  return { isLoading, data, onClick: handleClick };
};

// View layer uses the data:
// apps/portal-web/: <CButton onClick={onClick}>
// apps/mobile/: <TouchableOpacity onPress={onClick}>
```

### 2. **Hooks Return Data, Not JSX**
Hooks are business logic containers. Views consume and render them.

### 3. **Services Don't Know About Authentication Method**
Services accept `getToken` as a dependency, not MSAL directly.

```typescript
// ✅ GOOD
const apiClient = createApiClient(async () => {
  return await authService.getToken();
});

// Works for both web (MSAL) and mobile (OAuth)
```

### 4. **Use TypeScript Interfaces for Abstraction**
Define interfaces in shared-services, implement per platform.

```typescript
// packages/shared-services/auth/types.ts
export interface IAuthService {
  login(): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): Promise<string>;
}

// Web: MsalAuthService implements IAuthService
// Mobile: MobileAuthService implements IAuthService
```

---

## Implementation Paths

### 🚀 Fast Path: 1 Day Setup (Recommended)

**See [MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md) for detailed copy-paste commands.**

Timeline: **6-8 hours**

1. **Create monorepo root** (15 min)
   - Directory structure, package.json, turbo.json

2. **Extract shared packages** (2.5 hours)
   - shared-types, shared-constants, shared-utils, shared-services, shared-hooks
   - Ready-to-use boilerplate provided

3. **Refactor web app** (1.5 hours)
   - Convert components to `.web.tsx` pattern
   - Update imports to use shared packages
   - Verify app still works

4. **Verify monorepo** (30 min)
   - Build everything
   - Run dev server
   - Confirm no errors

**Result**: Foundation ready. Add mobile screens incrementally as needed.

---

### 📚 Detailed Path: Full Architecture Setup (Reference)

If you prefer a slower, more detailed implementation with comprehensive testing:

#### Phase 1: Set Up Monorepo Structure (1-2 days)
- [ ] Create Turborepo root
- [ ] Move existing portal-web to `apps/portal-web`
- [ ] Create placeholder `apps/mobile`
- [ ] Create `packages/shared-*` directories

#### Phase 2: Extract Shared Packages (2-3 days)
- [ ] Extract types to `packages/shared-types`
- [ ] Extract constants to `packages/shared-constants`
- [ ] Extract API client logic to `packages/shared-services/api`
- [ ] Create `packages/shared-utils`

#### Phase 3: Refactor Web App (2-3 days)
- [ ] Convert components to `.web.tsx` pattern
- [ ] Extract hooks to `packages/shared-hooks`
- [ ] Implement auth service abstraction
- [ ] Verify web app still works (no breaking changes)

#### Phase 4: Add Mobile App (2-3 weeks)
- [ ] Set up React Native + Expo in `apps/mobile`
- [ ] Create `.native.tsx` versions of core screens
- [ ] Implement mobile auth service
- [ ] Test shared hooks on mobile
- [ ] Build out remaining mobile screens

#### Phase 5: Optimize & Deploy (1-2 weeks)
- [ ] Set up CI/CD for web and mobile builds
- [ ] Performance optimization
- [ ] Shared component library documentation

**Notes**: 
- Phase 4-5 are for building a complete mobile app. You can skip these initially.
- Phases 1-3 (~1 week detailed) = same as the 1-day fast path, just with more explanation.
- Add mobile incrementally after foundation is solid.

---

## Technology Stack

### Web (`apps/portal-web`)
- **Framework**: React 19 + React Router 6
- **UI**: CoreUI 5.x + Bootstrap 5
- **Admin**: React Admin 5.13
- **Build**: Vite 7
- **Auth**: @azure/msal-react (MSAL 3)
- **API**: Axios or Fetch
- **State**: React Context (UserContext, RoleContext)
- **Forms**: React Hook Form

### Mobile (`apps/mobile`)
- **Framework**: React Native (or Expo)
- **Navigation**: React Navigation 6
- **UI**: React Native Paper or NativeBase
- **Build**: Expo CLI or Bare React Native
- **Auth**: Custom OAuth + AsyncStorage
- **API**: Axios or Fetch (shared)
- **State**: Context or Zustand
- **Forms**: React Hook Form (same as web!)

### Shared (`packages/*`)
- **Language**: TypeScript 5.9
- **Runtime**: Node 18+
- **Package Manager**: npm workspaces

---

## Success Criteria

✅ Both web and mobile use identical hooks for business logic  
✅ No duplicated API client code  
✅ Same TypeScript types across platforms  
✅ Mobile development doesn't duplicate web logic  
✅ Single test suite for business logic  
✅ CI/CD builds both platforms in parallel  

---

## Next Steps

**To get started today:**

1. **Read** [MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md) for copy-paste commands
2. **Follow** the step-by-step setup (takes ~6-8 hours)
3. **Reference** the detailed docs as needed:
   - [SHARED_PACKAGES_ARCHITECTURE.md](./SHARED_PACKAGES_ARCHITECTURE.md) - Package structure details
   - [PLATFORM_CONDITIONAL_PATTERNS.md](./PLATFORM_CONDITIONAL_PATTERNS.md) - Implementation patterns
   - [AUTHENTICATION_ABSTRACTION.md](./AUTHENTICATION_ABSTRACTION.md) - Auth abstraction strategy

**After foundation is ready**, add mobile screens incrementally using the patterns from [PLATFORM_CONDITIONAL_PATTERNS.md](./PLATFORM_CONDITIONAL_PATTERNS.md).


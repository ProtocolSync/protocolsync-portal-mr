# Platform-Conditional Patterns
## Building Web and Mobile from the Same Component Code

**Purpose**: Define how to structure component code, imports, and builds to support both React (web) and React Native (mobile) from a single codebase.

---

## Overview

The key to sharing business logic while supporting different UIs is the **`.web.ts`/`.native.ts` pattern**. Bundlers (Webpack/Vite for web, Metro for React Native) automatically resolve the correct platform-specific file.

```
Component/
├── Button.web.tsx          ← Bundler uses this for web
├── Button.native.tsx        ← Bundler uses this for mobile
└── Button.tsx              ← Export point (shared interface)
```

When you import `import { Button } from './Button'`, the bundler automatically loads:
- **Web**: `Button.web.tsx`
- **Mobile**: `Button.native.tsx`

---

## Pattern 1: View Components (Different UI)

### Login Component Example

#### `src/components/Login.tsx` (Export point)
```typescript
// Web build: resolves to Login.web.tsx
// Mobile build: resolves to Login.native.tsx
export { Login } from './Login.web';
```

#### `apps/portal-web/src/components/Login.web.tsx`
```typescript
import { useState } from 'react';
import { CButton, CCard, CCardBody, CSpinner, CAlert } from '@coreui/react';
import { useLogin } from '@protocolsync/shared-hooks';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login = ({ onSuccess }: LoginProps) => {
  const { isLoggingIn, error, handleLogin } = useLogin(authService);
  
  const handleClick = async () => {
    try {
      await handleLogin();
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CCard className="p-4">
        <CCardBody>
          <h1>Login</h1>
          <p className="text-body-secondary">Sign in to your compliance portal</p>
          
          {error && (
            <CAlert color="danger" className="mb-4">
              {error}
            </CAlert>
          )}
          
          <CButton 
            color="primary" 
            className="w-100"
            onClick={handleClick}
            disabled={isLoggingIn}
            style={{ backgroundColor: '#005C4D' }}
          >
            {isLoggingIn ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Signing in...
              </>
            ) : (
              'Sign in with Microsoft'
            )}
          </CButton>
        </CCardBody>
      </CCard>
    </div>
  );
};
```

#### `apps/mobile/src/screens/Login.native.tsx`
```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogin } from '@protocolsync/shared-hooks';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login = ({ onSuccess }: LoginProps) => {
  const { isLoggingIn, error, handleLogin } = useLogin(authService);
  
  const handlePress = async () => {
    try {
      await handleLogin();
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Login
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Sign in to your compliance portal
          </Text>
        </View>
        
        {error && (
          <View style={{ backgroundColor: '#fee', padding: 12, borderRadius: 4, marginBottom: 16 }}>
            <Text style={{ color: '#c00' }}>{error}</Text>
          </View>
        )}
        
        <TouchableOpacity
          onPress={handlePress}
          disabled={isLoggingIn}
          style={{
            backgroundColor: '#005C4D',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            opacity: isLoggingIn ? 0.6 : 1,
          }}
        >
          {isLoggingIn ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8 }}>
                Signing in...
              </Text>
            </>
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              Sign in with Microsoft
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
```

**Key Points**:
- ✅ Both use `useLogin()` from shared-hooks (identical logic)
- ✅ Web uses CoreUI components (`CButton`, `CCard`, `CSpinner`)
- ✅ Mobile uses React Native components (`TouchableOpacity`, `View`, `ActivityIndicator`)
- ✅ Same interface (`LoginProps`), different implementations
- ✅ `Login.tsx` is just an export wrapper

---

## Pattern 2: Hooks with Platform-Specific Behavior

Some hooks may need platform-specific implementations. Use the same pattern:

#### `src/hooks/useNavigation.tsx` (Export)
```typescript
export { useNavigation } from './useNavigation.web';
```

#### `src/hooks/useNavigation.web.ts` (Web)
```typescript
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();
  
  return {
    goToLogin: () => navigate('/login'),
    goToDashboard: () => navigate('/dashboard'),
    goBack: () => navigate(-1),
  };
};
```

#### `src/hooks/useNavigation.native.ts` (Mobile)
```typescript
import { useNavigation as useRNNavigation } from '@react-navigation/native';

export const useNavigation = () => {
  const navigation = useRNNavigation();
  
  return {
    goToLogin: () => navigation.navigate('Login'),
    goToDashboard: () => navigation.navigate('Dashboard'),
    goBack: () => navigation.goBack(),
  };
};
```

**Usage** (identical in both platforms):
```typescript
export const SomeScreen = () => {
  const { goToDashboard } = useNavigation();
  
  return (
    // ...
    <TouchableOpacity onPress={goToDashboard}>
      <Text>Go to Dashboard</Text>
    </TouchableOpacity>
  );
};
```

---

## Pattern 3: Utilities with Platform APIs

#### `packages/shared-utils/src/storage.tsx` (Export)
```typescript
export { useStorage } from './storage.web';
```

#### `packages/shared-utils/src/storage.web.ts` (localStorage)
```typescript
export const useStorage = () => {
  const get = (key: string): string | null => localStorage.getItem(key);
  const set = (key: string, value: string): void => localStorage.setItem(key, value);
  const remove = (key: string): void => localStorage.removeItem(key);
  const clear = (): void => localStorage.clear();
  
  return { get, set, remove, clear };
};
```

#### `packages/shared-utils/src/storage.native.ts` (AsyncStorage)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStorage = () => {
  const get = async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  };
  
  const set = async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  };
  
  const remove = async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  };
  
  const clear = async (): Promise<void> => {
    await AsyncStorage.clear();
  };
  
  return { get, set, remove, clear };
};
```

**Note**: Web version is synchronous, mobile is async (AsyncStorage limitation). Consumers should handle this.

---

## Pattern 4: Services with Platform-Specific Implementations

#### Authentication Service Pattern

##### `packages/shared-services/src/auth/AuthService.ts` (Interface)
```typescript
export interface IAuthService {
  login(): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): Promise<string>;
  isAuthenticated(): boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  expiresIn: number;
}
```

##### `apps/portal-web/src/services/auth.web.ts` (MSAL)
```typescript
import { IAuthService, AuthResponse } from '@protocolsync/shared-services';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export const createAuthService = (msalInstance): IAuthService => {
  return {
    async login(): Promise<AuthResponse> {
      try {
        const response = await msalInstance.loginPopup(loginRequest);
        msalInstance.setActiveAccount(response.account);
        
        const token = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: response.account,
        });
        
        return {
          accessToken: token.accessToken,
          user: response.account,
          expiresIn: 3600,
        };
      } catch (error) {
        throw new Error(`MSAL login failed: ${error.message}`);
      }
    },
    
    async logout(): Promise<void> {
      await msalInstance.logoutPopup();
    },
    
    async getToken(): Promise<string> {
      const accounts = msalInstance.getAllAccounts();
      if (!accounts.length) throw new Error('Not authenticated');
      
      const token = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0],
      });
      
      return token.accessToken;
    },
    
    isAuthenticated(): boolean {
      return msalInstance.getAllAccounts().length > 0;
    },
  };
};
```

##### `apps/mobile/src/services/auth.native.ts` (OAuth + AsyncStorage)
```typescript
import { IAuthService, AuthResponse } from '@protocolsync/shared-services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';

export const createAuthService = (config: AuthConfig): IAuthService => {
  return {
    async login(): Promise<AuthResponse> {
      try {
        const result = await AuthSession.startAsync({
          authUrl: `${config.authUrl}?client_id=${config.clientId}&...`,
          returnUrl: config.redirectUrl,
        });
        
        if (result.type === 'success') {
          const { access_token, user } = result.params;
          await AsyncStorage.setItem('accessToken', access_token);
          
          return {
            accessToken: access_token,
            user,
            expiresIn: 3600,
          };
        }
        
        throw new Error('Authentication cancelled');
      } catch (error) {
        throw new Error(`OAuth login failed: ${error.message}`);
      }
    },
    
    async logout(): Promise<void> {
      await AsyncStorage.removeItem('accessToken');
      // Call logout endpoint if needed
    },
    
    async getToken(): Promise<string> {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      return token;
    },
    
    async isAuthenticated(): Promise<boolean> {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    },
  };
};
```

**Usage** (platform-agnostic):
```typescript
// In any component/hook
const { handleLogin } = useLogin(authService);
// authService automatically uses correct implementation
```

---

## Pattern 5: Shared Components That Don't Need Platform Files

If a component has no platform-specific code, put it directly in shared (without `.web` or `.native` extensions):

```typescript
// packages/shared-components/src/Card.tsx
import { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  children: ReactNode;
}

export const Card = ({ title, children }: CardProps) => {
  return (
    <div className="card">
      {title && <div className="card-title">{title}</div>}
      <div className="card-content">{children}</div>
    </div>
  );
};
```

**Wait—that example has HTML!** Right, so this wouldn't be shared. A truly shared component would be:

```typescript
// ✅ GOOD: A truly shared component
export interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

// But you'd still need platform implementations
// because the above interface doesn't define HOW to render
```

**In practice**: Most components need `.web`/`.native` versions. Data-only components can be shared.

---

## Bundler Configuration

### Web: Vite
Vite handles `.web` / `.native` extensions automatically via a custom resolve plugin.

#### `apps/portal-web/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    alias: {
      '@protocolsync/shared-types': '@protocolsync/shared-types/dist',
      '@protocolsync/shared-services': '@protocolsync/shared-services/dist',
      '@protocolsync/shared-hooks': '@protocolsync/shared-hooks/dist',
    },
  },
});
```

Vite automatically resolves `import { Button } from './Button'` to `Button.web.tsx` when bundling for web.

### Mobile: Metro (React Native)
Metro's `sourceExts` config determines file resolution order.

#### `apps/mobile/metro.config.js`
```javascript
const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve .native.ts before .ts
config.resolver.sourceExts = [
  'native.ts',
  'native.tsx',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
];

module.exports = config;
```

Metro resolves `import { Button } from './Button'` to `Button.native.tsx` when bundling for mobile.

---

## File Organization Best Practices

### ❌ Don't Mix Platform Code
```
components/
├── Login.tsx  ← BAD: Has both <div> and <View>
```

### ✅ Use Platform Extensions
```
components/
├── Login/
│   ├── Login.web.tsx      (CoreUI + HTML)
│   ├── Login.native.tsx    (React Native)
│   └── Login.tsx           (export)

hooks/
├── useNavigation/
│   ├── useNavigation.web.ts     (Router)
│   ├── useNavigation.native.ts  (React Navigation)
│   └── useNavigation.ts         (export)
```

### ✅ Shared Code Goes in Packages
```
packages/shared-hooks/
├── useLogin.ts      (no platform code - uses authService)
├── useFetchData.ts  (no platform code - uses apiClient)
└── useValidation.ts (pure TS - no React DOM or RN)
```

---

## Common Gotchas

### ❌ Mistake 1: Importing React DOM in Shared Code
```typescript
// ❌ WRONG - in packages/shared-hooks
import { useNavigate } from 'react-router-dom';

export const useMyHook = () => {
  const navigate = useNavigate();  // Only works on web!
};
```

### ✅ Fix: Inject Dependencies
```typescript
// ✅ CORRECT
export const useMyHook = (navigate: (path: string) => void) => {
  return { onClick: () => navigate('/path') };
};

// Web: useMyHook(useNavigate())
// Mobile: useMyHook((path) => navigation.navigate(path))
```

### ❌ Mistake 2: Async/Await Inconsistency
```typescript
// ❌ WRONG
export const getToken = () => {
  // Web: localStorage is sync
  return localStorage.getItem('token');
};

// Mobile: AsyncStorage is async
// This breaks!
```

### ✅ Fix: Make Everything Async
```typescript
// ✅ CORRECT
export const getToken = async () => {
  return await storageService.get('token');
};

// Both web and mobile await it
```

### ❌ Mistake 3: Conditional Imports in Shared Code
```typescript
// ❌ WRONG
import Button from './Button.web';  // Hardcoded!

export const Component = () => <Button />;
```

### ✅ Fix: Use Platform-Aware Imports
```typescript
// ✅ CORRECT
import { Button } from './Button';  // Resolves automatically

export const Component = () => <Button />;
```

---

## Testing Platform-Specific Code

### Web Tests
```typescript
// __tests__/Login.web.test.tsx
import { render, screen } from '@testing-library/react';
import { Login } from '../Login';

test('renders CoreUI button', () => {
  render(<Login />);
  expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
});
```

### Mobile Tests
```typescript
// __tests__/Login.native.test.tsx
import { render, screen } from '@testing-library/react-native';
import { Login } from '../Login';

test('renders TouchableOpacity', () => {
  render(<Login />);
  expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
});
```

### Shared Code Tests
```typescript
// packages/shared-hooks/__tests__/useLogin.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLogin } from '../useLogin';

test('handles login error', async () => {
  const mockAuthService = {
    login: async () => { throw new Error('Auth failed'); },
  };
  
  const { result } = renderHook(() => useLogin(mockAuthService));
  
  await act(async () => {
    try {
      await result.current.handleLogin();
    } catch (e) {
      expect(e.message).toBe('Auth failed');
    }
  });
});
```

---

## Migration Strategy

1. **Start with hooks** - Extract business logic to `packages/shared-hooks`
2. **Create export wrappers** - Add `Component.tsx` that exports from `.web.tsx`
3. **Extract mobile views** - Create `.native.tsx` versions
4. **Remove redundancy** - Delete duplicate logic from mobile implementation
5. **Test both platforms** - Run tests for web and mobile builds


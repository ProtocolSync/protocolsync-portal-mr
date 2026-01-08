# Authentication Abstraction Strategy
## Platform-Agnostic Auth for Web and Mobile

**Purpose**: Decouple authentication logic from MSAL (web) so mobile can use different auth methods while sharing the same app logic.

---

## Problem Statement

**Current State**: 
- Web uses `@azure/msal-react` directly in components
- MSAL is tightly coupled to `UserContext`, `Login.tsx`, and data providers
- Mobile cannot use MSAL (not React Native compatible)
- Result: Cannot share authentication between platforms

**Goal**:
- Define interface-based authentication abstraction
- Web implements via MSAL
- Mobile implements via custom OAuth or another service
- Both platforms share the same UserContext and hooks

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│  App Business Logic Layer           │
│  (useLogin, useUser, hooks)         │
│  Depends on: IAuthService           │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  IAuthService Interface              │
│  (Abstract contract)                 │
└──────────────┬──────────────────────┘
        ┌──────┴──────┐
        ↓             ↓
    Web Impl.    Mobile Impl.
    ┌────────┐  ┌────────────┐
    │ MSAL   │  │ OAuth +    │
    │Provider│  │ AsyncStg.  │
    └────────┘  └────────────┘
```

---

## Step 1: Define Auth Interface

### `packages/shared-services/src/auth/IAuthService.ts`

```typescript
/**
 * Abstract authentication service interface
 * Implemented by platforms differently:
 * - Web: MSAL (@azure/msal-react)
 * - Mobile: Custom OAuth + AsyncStorage
 */
export interface IAuthService {
  /**
   * Initiate login flow
   * @returns User data with access token
   */
  login(): Promise<AuthResponse>;
  
  /**
   * Logout and clear all credentials
   */
  logout(): Promise<void>;
  
  /**
   * Get current access token
   * @throws AuthError if not authenticated
   */
  getToken(): Promise<string>;
  
  /**
   * Refresh expired token
   * @returns New access token
   */
  refreshToken(): Promise<string>;
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean | Promise<boolean>;
  
  /**
   * Get currently logged-in user
   * @returns User object from backend
   */
  getUser(): Promise<User>;
  
  /**
   * Clear all cached credentials
   */
  clearCredentials(): Promise<void>;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
  expiresAt?: number;
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NotAuthenticatedError extends AuthError {
  constructor() {
    super('NOT_AUTHENTICATED', 'User is not authenticated');
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('TOKEN_EXPIRED', 'Access token has expired');
  }
}
```

### `packages/shared-services/src/auth/index.ts`
```typescript
export * from './IAuthService';
export * from './tokenManager';
```

---

## Step 2: Token Manager (Shared)

### `packages/shared-services/src/auth/tokenManager.ts`

This utility handles token lifecycle for both platforms:

```typescript
/**
 * Platform-agnostic token manager
 * Handles expiration, refresh, and validation
 */
export class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;
  private refreshCallback: (() => Promise<string>) | null = null;
  
  /**
   * Store a token and its expiration
   */
  setToken(token: string, expiresIn: number, refreshToken?: string): void {
    this.accessToken = token;
    this.refreshToken = refreshToken || null;
    this.expiresAt = Date.now() + (expiresIn * 1000);
  }
  
  /**
   * Get current token, refreshing if needed
   */
  async getToken(): Promise<string> {
    if (!this.accessToken) {
      throw new NotAuthenticatedError();
    }
    
    // Check if token is expired (with 30-second buffer)
    if (this.expiresAt && Date.now() >= (this.expiresAt - 30000)) {
      if (this.refreshCallback) {
        const newToken = await this.refreshCallback();
        this.accessToken = newToken;
        return newToken;
      }
    }
    
    return this.accessToken;
  }
  
  /**
   * Check if token exists and is valid
   */
  isValid(): boolean {
    if (!this.accessToken || !this.expiresAt) return false;
    return Date.now() < this.expiresAt;
  }
  
  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= this.expiresAt;
  }
  
  /**
   * Get time until expiration in seconds
   */
  getTimeToExpiration(): number {
    if (!this.expiresAt) return -1;
    return Math.max(0, (this.expiresAt - Date.now()) / 1000);
  }
  
  /**
   * Register callback for token refresh
   */
  onTokenRefresh(callback: () => Promise<string>): void {
    this.refreshCallback = callback;
  }
  
  /**
   * Clear all tokens
   */
  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }
  
  /**
   * Get refresh token (for mobile storage)
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}
```

---

## Step 3: Web Implementation (MSAL)

### `apps/portal-web/src/services/auth/MsalAuthService.ts`

```typescript
import { IAuthService, AuthResponse } from '@protocolsync/shared-services';
import { useMsal } from '@azure/msal-react';
import { loginRequest, scopes } from '../../authConfig';
import { UserService } from '@protocolsync/shared-services';

/**
 * Web implementation of IAuthService using Azure MSAL
 * Integrates with existing Azure AD setup
 */
export class MsalAuthService implements IAuthService {
  private msalInstance: any;
  private userService: UserService;
  private tokenCache: Map<string, string> = new Map();
  
  constructor(msalInstance: any, userService: UserService) {
    this.msalInstance = msalInstance;
    this.userService = userService;
  }
  
  async login(): Promise<AuthResponse> {
    try {
      console.log('🔄 Starting MSAL login...');
      
      // Initiate login popup
      const response = await this.msalInstance.loginPopup(loginRequest);
      
      if (!response.account) {
        throw new Error('Login successful but account not set');
      }
      
      // Set as active account
      this.msalInstance.setActiveAccount(response.account);
      console.log('✅ MSAL login successful:', response.account.username);
      
      // Acquire token
      const tokenResponse = await this.msalInstance.acquireTokenSilent({
        scopes,
        account: response.account,
      });
      
      // Fetch user from ProtocolSync backend
      const user = await this.userService.getProfile();
      
      return {
        accessToken: tokenResponse.accessToken,
        user,
        expiresIn: 3600,
        expiresAt: Date.now() + (3600 * 1000),
      };
    } catch (error: any) {
      console.error('❌ MSAL login error:', error);
      
      // Handle user cancellation gracefully
      if (error.errorCode === 'user_cancelled') {
        throw new AuthError('USER_CANCELLED', 'Login cancelled by user');
      }
      
      throw new AuthError(
        error.errorCode || 'LOGIN_FAILED',
        error.message || 'Failed to login with MSAL'
      );
    }
  }
  
  async logout(): Promise<void> {
    try {
      await this.msalInstance.logoutPopup();
      this.tokenCache.clear();
      console.log('✅ Logged out successfully');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      throw new AuthError('LOGOUT_FAILED', 'Failed to logout');
    }
  }
  
  async getToken(): Promise<string> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      
      if (!accounts || accounts.length === 0) {
        throw new NotAuthenticatedError();
      }
      
      const account = accounts[0];
      const cachedToken = this.tokenCache.get(account.localAccountId);
      
      if (cachedToken) {
        return cachedToken;
      }
      
      // Acquire token silently
      const tokenResponse = await this.msalInstance.acquireTokenSilent({
        scopes,
        account,
      });
      
      // Cache token
      this.tokenCache.set(account.localAccountId, tokenResponse.accessToken);
      
      return tokenResponse.accessToken;
    } catch (error: any) {
      if (error instanceof NotAuthenticatedError) {
        throw error;
      }
      throw new AuthError('TOKEN_ACQUISITION_FAILED', error.message);
    }
  }
  
  async refreshToken(): Promise<string> {
    // MSAL handles refresh automatically via acquireTokenSilent
    return this.getToken();
  }
  
  isAuthenticated(): boolean {
    return this.msalInstance.getAllAccounts().length > 0;
  }
  
  async getUser(): Promise<User> {
    if (!this.isAuthenticated()) {
      throw new NotAuthenticatedError();
    }
    
    return this.userService.getProfile();
  }
  
  async clearCredentials(): Promise<void> {
    this.tokenCache.clear();
    await this.logout();
  }
}

// Factory function
export const createMsalAuthService = (
  msalInstance: any,
  userService: UserService
): IAuthService => {
  return new MsalAuthService(msalInstance, userService);
};
```

### Usage in Web App

#### `apps/portal-web/src/App.tsx`

```typescript
import { MsalProvider, useMsal } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import { createMsalAuthService } from './services/auth/MsalAuthService';
import { UserProvider } from './contexts/UserContext';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Create auth service
const authService = createMsalAuthService(msalInstance, userService);

export const App = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <UserProvider authService={authService}>
        <Router>
          {/* Routes */}
        </Router>
      </UserProvider>
    </MsalProvider>
  );
};
```

---

## Step 4: Mobile Implementation (OAuth + AsyncStorage)

### `apps/mobile/src/services/auth/MobileAuthService.ts`

```typescript
import { IAuthService, AuthResponse } from '@protocolsync/shared-services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { UserService } from '@protocolsync/shared-services';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@protocolsync_access_token',
  REFRESH_TOKEN: '@protocolsync_refresh_token',
  USER: '@protocolsync_user',
  EXPIRES_AT: '@protocolsync_expires_at',
};

/**
 * Mobile implementation of IAuthService using OAuth + AsyncStorage
 * Handles Azure AD auth flow for React Native
 */
export class MobileAuthService implements IAuthService {
  private userService: UserService;
  private oauth2Config: OAuth2Config;
  
  constructor(userService: UserService, config: OAuth2Config) {
    this.userService = userService;
    this.oauth2Config = config;
  }
  
  async login(): Promise<AuthResponse> {
    try {
      console.log('🔄 Starting OAuth login...');
      
      // Create OAuth discovery document
      const discovery = await AuthSession.fetchDiscoveryAsync(
        this.oauth2Config.discoveryUrl
      );
      
      // Create OAuth request
      const request = new AuthSession.AuthRequest({
        clientId: this.oauth2Config.clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUrl: AuthSession.getRedirectUrl(),
      });
      
      // Prompt user to login
      const result = await request.promptAsync(discovery);
      
      if (result.type === 'cancel') {
        throw new AuthError('USER_CANCELLED', 'Login cancelled by user');
      }
      
      if (result.type !== 'success') {
        throw new AuthError('LOGIN_FAILED', `OAuth failed with type: ${result.type}`);
      }
      
      // Exchange code for token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: this.oauth2Config.clientId,
          code: result.params.code,
          redirectUrl: AuthSession.getRedirectUrl(),
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        discovery
      );
      
      // Fetch user profile from ProtocolSync backend
      const user = await this.userService.getProfile();
      
      // Store tokens
      await this.storeTokens(
        tokenResponse.accessToken,
        tokenResponse.refreshToken || '',
        tokenResponse.expiresIn || 3600
      );
      
      console.log('✅ OAuth login successful');
      
      return {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        user,
        expiresIn: tokenResponse.expiresIn || 3600,
        expiresAt: Date.now() + ((tokenResponse.expiresIn || 3600) * 1000),
      };
    } catch (error: any) {
      console.error('❌ OAuth login error:', error);
      throw error instanceof AuthError 
        ? error 
        : new AuthError('LOGIN_FAILED', error.message);
    }
  }
  
  async logout(): Promise<void> {
    try {
      // Clear stored tokens
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.EXPIRES_AT),
      ]);
      
      console.log('✅ Logged out successfully');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      throw new AuthError('LOGOUT_FAILED', error.message);
    }
  }
  
  async getToken(): Promise<string> {
    try {
      // Check if token exists and is valid
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
      
      if (!accessToken) {
        throw new NotAuthenticatedError();
      }
      
      // Check expiration
      if (expiresAt && Date.now() >= parseInt(expiresAt, 10) - 30000) {
        // Token expired or about to expire, try refresh
        return await this.refreshToken();
      }
      
      return accessToken;
    } catch (error: any) {
      if (error instanceof NotAuthenticatedError) {
        throw error;
      }
      throw new AuthError('TOKEN_RETRIEVAL_FAILED', error.message);
    }
  }
  
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new NotAuthenticatedError();
      }
      
      // Call API to refresh token
      const response = await fetch(`${this.oauth2Config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      // Store new tokens
      await this.storeTokens(
        data.accessToken,
        data.refreshToken || refreshToken,
        data.expiresIn || 3600
      );
      
      return data.accessToken;
    } catch (error: any) {
      console.error('❌ Token refresh error:', error);
      throw new AuthError('TOKEN_REFRESH_FAILED', error.message);
    }
  }
  
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
      
      if (!token || !expiresAt) {
        return false;
      }
      
      // Check if not expired
      return Date.now() < parseInt(expiresAt, 10);
    } catch {
      return false;
    }
  }
  
  async getUser(): Promise<User> {
    try {
      // Try to get cached user first
      const cachedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      
      // Otherwise fetch from backend
      const user = await this.userService.getProfile();
      
      // Cache it
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      throw new AuthError('USER_FETCH_FAILED', error.message);
    }
  }
  
  async clearCredentials(): Promise<void> {
    await this.logout();
  }
  
  private async storeTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    const expiresAt = (Date.now() + (expiresIn * 1000)).toString();
    
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      AsyncStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt),
    ]);
  }
}

interface OAuth2Config {
  clientId: string;
  discoveryUrl: string;
  apiBaseUrl: string;
}

export const createMobileAuthService = (
  userService: UserService,
  config: OAuth2Config
): IAuthService => {
  return new MobileAuthService(userService, config);
};
```

### Usage in Mobile App

#### `apps/mobile/src/App.tsx`

```typescript
import { createMobileAuthService } from './services/auth/MobileAuthService';
import { UserProvider } from './contexts/UserContext';

const authConfig: OAuth2Config = {
  clientId: process.env.EXPO_PUBLIC_AZURE_CLIENT_ID || '',
  discoveryUrl: 'https://login.microsoftonline.com/[TENANT]/v2.0/.well-known/openid-configuration',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
};

const authService = createMobileAuthService(userService, authConfig);

export const App = () => {
  return (
    <UserProvider authService={authService}>
      <RootNavigator />
    </UserProvider>
  );
};
```

---

## Step 5: Shared UserContext

### `packages/shared-services/src/user/UserContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IAuthService } from '../auth/IAuthService';
import { User } from '@protocolsync/shared-types';

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: ReactNode;
  authService: IAuthService;
}

export const UserProvider = ({ children, authService }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already logged in (on mount)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          const currentUser = await authService.getUser();
          setUser(currentUser);
        }
      } catch (err: any) {
        console.error('Auth check failed:', err);
        setError(null); // Silent fail on init
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [authService]);
  
  const login = async () => {
    try {
      setError(null);
      const response = await authService.login();
      setUser(response.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };
  
  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };
  
  const refetchUser = async () => {
    try {
      const currentUser = await authService.getUser();
      setUser(currentUser);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const value: UserContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    refetchUser,
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

---

## Step 6: Shared useLogin Hook

### `packages/shared-hooks/src/useLogin.ts`

```typescript
import { useState } from 'react';
import { useUser } from '@protocolsync/shared-services';

/**
 * Platform-agnostic login hook
 * Works with any IAuthService implementation
 */
export const useLogin = () => {
  const { login, error } = useUser();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return { isLoggingIn, error, handleLogin };
};
```

---

## Configuration by Platform

### Web: `.env.local`
```
VITE_AZURE_CLIENT_ID=d29b70a1-86f2-4ae4-8da9-823416860cda
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_API_BASE_URL=https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net
```

### Mobile: `.env.local`
```
EXPO_PUBLIC_AZURE_CLIENT_ID=d29b70a1-86f2-4ae4-8da9-823416860cda
EXPO_PUBLIC_AZURE_TENANT_ID=your-tenant-id
EXPO_PUBLIC_API_BASE_URL=https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net
```

---

## Benefits of This Approach

✅ **Abstraction**: Business logic doesn't care which auth method is used  
✅ **Testability**: Mock IAuthService for unit tests  
✅ **Flexibility**: Can switch auth methods without breaking app logic  
✅ **Reusability**: UserContext and useLogin work on both platforms  
✅ **Type Safety**: TypeScript ensures both implementations match contract  
✅ **Maintainability**: Auth logic centralized, single source of truth  

---

## Migration Checklist

- [ ] Create IAuthService interface
- [ ] Create TokenManager utility
- [ ] Implement MsalAuthService for web
- [ ] Test web auth still works
- [ ] Create shared UserContext
- [ ] Create useLogin hook
- [ ] Implement MobileAuthService for mobile
- [ ] Test mobile auth flow
- [ ] Document auth flow diagram
- [ ] Add error handling examples


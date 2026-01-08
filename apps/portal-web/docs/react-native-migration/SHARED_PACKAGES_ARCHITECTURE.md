# Shared Packages Architecture
## Business Logic Layer for Web + Mobile

**Purpose**: Define the structure and organization of `packages/` workspace that holds all shared, platform-agnostic code.

---

## Overview

The `packages/` workspace contains the **heart** of your application—all business logic, data models, API integration, and utilities that both web and mobile apps consume. No UI framework dependencies here.

```
packages/
├── shared-types/          (TypeScript interfaces - 0 dependencies)
├── shared-constants/      (Enums, endpoints, config values)
├── shared-utils/          (Pure functions: validation, formatting, helpers)
├── shared-services/       (API clients, auth, business operations)
└── shared-hooks/          (React hooks: business logic wrappers)
```

---

## 1. `packages/shared-types/`
### Purpose
All TypeScript interfaces and types used across the application. **Zero dependencies.**

### Structure
```
packages/shared-types/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              (Export all types)
│   ├── api.ts                (API request/response types)
│   ├── user.ts               (User, Role, Permission types)
│   ├── dashboard.ts          (Dashboard-specific types)
│   ├── billing.ts            (Billing, subscription types)
│   ├── site.ts               (Site, trial, protocol types)
│   ├── errors.ts             (Error response types)
│   └── forms.ts              (Form data types)
└── README.md
```

### Example Files

#### `src/api.ts`
```typescript
// Base API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Request types
export interface ListRequest {
  pagination?: { page: number; perPage: number };
  sort?: { field: string; order: 'ASC' | 'DESC' };
  filter?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface CreateRequest<T> {
  data: T;
  meta?: Record<string, any>;
}
```

#### `src/user.ts`
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company: Company;
  roles: Role[];
  activeRole: Role;
  permissions: Permission[];
  lastLogin: Date;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  subscription: SubscriptionStatus;
}

export enum Role {
  CRO_ADMIN = 'admin',
  SITE_ADMIN = 'site_admin',
  TRIAL_LEAD = 'trial_lead',
  SITE_USER = 'site_user',
}

export interface Permission {
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete';
}
```

#### `src/dashboard.ts`
```typescript
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
  trialsCount: number;
  usersCount: number;
}

export interface AdminListItem {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}
```

#### `src/errors.ts`
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super('AUTH_ERROR', message, 401);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Access denied') {
    super('PERMISSION_DENIED', message, 403);
    this.name = 'PermissionError';
  }
}
```

#### `src/index.ts`
```typescript
// Export all types
export * from './api';
export * from './user';
export * from './dashboard';
export * from './billing';
export * from './site';
export * from './errors';
export * from './forms';
```

### `package.json`
```json
{
  "name": "@protocolsync/shared-types",
  "version": "1.0.0",
  "description": "Shared TypeScript types for ProtocolSync",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

---

## 2. `packages/shared-constants/`
### Purpose
Configuration values, API endpoints, enums, and constants. **No dependencies** (except shared-types for types).

### Structure
```
packages/shared-constants/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── api.ts              (API endpoints)
│   ├── roles.ts            (Role definitions)
│   ├── permissions.ts      (Permission matrix)
│   ├── config.ts           (App configuration)
│   └── defaults.ts         (Default values)
└── README.md
```

### Example Files

#### `src/api.ts`
```typescript
// API Configuration
export const API_CONFIG = {
  // Base URL determined at runtime based on environment
  // Web: https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net
  // Mobile: https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net (same)
  // Local: http://localhost:3000
  VERSION: 'v1',
  TIMEOUT: 30000,
};

// Endpoint paths (relative to base URL)
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Users
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  
  // Sites
  SITES: {
    LIST: '/sites',
    CREATE: '/sites',
    GET: (id: string) => `/sites/${id}`,
    UPDATE: (id: string) => `/sites/${id}`,
    DELETE: (id: string) => `/sites/${id}`,
  },
  
  // Site Administrators
  SITE_ADMINS: {
    LIST: '/site-administrators',
    CREATE: '/site-administrators',
    GET: (id: string) => `/site-administrators/${id}`,
    UPDATE: (id: string) => `/site-administrators/${id}`,
    DELETE: (id: string) => `/site-administrators/${id}`,
  },
  
  // Trials
  TRIALS: {
    LIST: '/trials',
    GET: (id: string) => `/trials/${id}`,
  },
  
  // Reports
  REPORTS: {
    GENERATE: '/reports/generate',
    LIST: '/reports',
  },
};

// Build full URL from endpoint
export const buildUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl(); // Determined at runtime
  return `${baseUrl}/${API_CONFIG.VERSION}${endpoint}`;
};

export const getApiBaseUrl = (): string => {
  // Web: use environment variable
  // Mobile: use environment variable
  return process.env.REACT_APP_API_BASE_URL || 'https://api.protocolsync.org';
};
```

#### `src/roles.ts`
```typescript
import { Role, Permission } from '@protocolsync/shared-types';

export const ROLE_HIERARCHY = {
  [Role.CRO_ADMIN]: 0,      // Highest
  [Role.SITE_ADMIN]: 1,
  [Role.TRIAL_LEAD]: 2,
  [Role.SITE_USER]: 3,      // Lowest
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.CRO_ADMIN]: 'CRO Administrator',
  [Role.SITE_ADMIN]: 'Site Administrator',
  [Role.TRIAL_LEAD]: 'Trial Lead',
  [Role.SITE_USER]: 'Site User',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.CRO_ADMIN]: 'Full system access, manage all sites and users',
  [Role.SITE_ADMIN]: 'Manage site-specific users and configurations',
  [Role.TRIAL_LEAD]: 'Lead clinical trial protocols and delegations',
  [Role.SITE_USER]: 'Access assigned protocols and reports',
};

// Available roles for switching
export const SWITCHABLE_ROLES: Record<Role, Role[]> = {
  [Role.CRO_ADMIN]: [Role.CRO_ADMIN, Role.SITE_ADMIN, Role.TRIAL_LEAD, Role.SITE_USER],
  [Role.SITE_ADMIN]: [Role.SITE_ADMIN, Role.TRIAL_LEAD, Role.SITE_USER],
  [Role.TRIAL_LEAD]: [Role.TRIAL_LEAD, Role.SITE_USER],
  [Role.SITE_USER]: [Role.SITE_USER],
};
```

#### `src/permissions.ts`
```typescript
import { Role, Permission } from '@protocolsync/shared-types';

// Define what each role can do
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.CRO_ADMIN]: [
    { resource: 'sites', action: 'read' },
    { resource: 'sites', action: 'create' },
    { resource: 'sites', action: 'update' },
    { resource: 'sites', action: 'delete' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'billing', action: 'read' },
    { resource: 'billing', action: 'update' },
  ],
  [Role.SITE_ADMIN]: [
    { resource: 'sites', action: 'read' },
    { resource: 'sites', action: 'update' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
  ],
  // ... etc
};

// Helper to check permission
export const hasPermission = (
  userRole: Role,
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete'
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.some(
    (p) => p.resource === resource && p.action === action
  );
};
```

---

## 3. `packages/shared-utils/`
### Purpose
Pure utility functions: validation, formatting, transformations, helpers.

### Structure
```
packages/shared-utils/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── validation.ts
│   ├── formatters.ts
│   ├── transformers.ts
│   └── helpers.ts
└── README.md
```

### Example Files

#### `src/validation.ts`
```typescript
import { ValidationError } from '@protocolsync/shared-types';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
  
  return { valid: errors.length === 0, errors };
};

export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, (value: any) => string | null>
): { valid: boolean; errors: Record<keyof T, string> } => {
  const errors: Record<keyof T, string> = {} as any;
  let valid = true;
  
  for (const key in schema) {
    const error = schema[key](data[key]);
    if (error) {
      errors[key] = error;
      valid = false;
    }
  }
  
  return { valid, errors };
};
```

#### `src/formatters.ts`
```typescript
export const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};
```

---

## 4. `packages/shared-services/`
### Purpose
API clients, authentication services, business operations. **Core service layer.**

### Structure
```
packages/shared-services/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── api/
│   │   ├── ApiClient.ts              (Base HTTP client)
│   │   ├── apiClient.ts              (Factory)
│   │   └── errorHandler.ts           (Error handling)
│   ├── auth/
│   │   ├── AuthService.ts            (Interface)
│   │   ├── msal.ts                   (MSAL implementation for web)
│   │   ├── oauth.ts                  (OAuth for mobile)
│   │   └── tokenManager.ts           (Token handling)
│   ├── user/
│   │   ├── userService.ts            (User CRUD operations)
│   │   └── roleService.ts            (Role management)
│   ├── site/
│   │   └── siteService.ts            (Site operations)
│   ├── dashboard/
│   │   └── dashboardService.ts       (Dashboard data calculations)
│   └── report/
│       └── reportService.ts          (Report generation)
└── README.md
```

### Example Files

#### `src/api/ApiClient.ts`
```typescript
import { ApiResponse, ApiError } from '@protocolsync/shared-types';

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
  
  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
  
  private async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...init?.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
```

#### `src/auth/AuthService.ts`
```typescript
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: any;
  expiresIn: number;
}

export interface IAuthService {
  login(): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): Promise<string>;
  refreshToken(): Promise<string>;
  isAuthenticated(): boolean;
}
```

#### `src/user/userService.ts`
```typescript
import { User, CreateRequest, ListRequest, ApiResponse } from '@protocolsync/shared-types';
import { API_ENDPOINTS, buildUrl } from '@protocolsync/shared-constants';
import { ApiClient } from '../api/ApiClient';

export class UserService {
  constructor(private apiClient: ApiClient) {}
  
  async getList(request: ListRequest): Promise<User[]> {
    const response = await this.apiClient.get<ApiResponse<User[]>>(
      buildUrl(API_ENDPOINTS.USERS.LIST)
    );
    return response.data || [];
  }
  
  async getById(id: string): Promise<User> {
    const response = await this.apiClient.get<ApiResponse<User>>(
      buildUrl(API_ENDPOINTS.USERS.GET(id))
    );
    return response.data!;
  }
  
  async create(data: Partial<User>): Promise<User> {
    const response = await this.apiClient.post<ApiResponse<User>>(
      buildUrl(API_ENDPOINTS.USERS.CREATE),
      data
    );
    return response.data!;
  }
  
  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await this.apiClient.put<ApiResponse<User>>(
      buildUrl(API_ENDPOINTS.USERS.UPDATE(id)),
      data
    );
    return response.data!;
  }
  
  async delete(id: string): Promise<void> {
    await this.apiClient.delete(buildUrl(API_ENDPOINTS.USERS.DELETE(id)));
  }
}
```

#### `src/dashboard/dashboardService.ts`
```typescript
import { DashboardStats } from '@protocolsync/shared-types';
import { ApiClient } from '../api/ApiClient';
import { SiteService } from '../site/siteService';
import { UserService } from '../user/userService';

export class DashboardService {
  constructor(
    private apiClient: ApiClient,
    private siteService: SiteService,
    private userService: UserService
  ) {}
  
  async getStats(companyId: string): Promise<DashboardStats> {
    try {
      const [sites, admins, users] = await Promise.all([
        this.siteService.getList({ meta: { companyId } }),
        this.apiClient.get(`/site-administrators?company_id=${companyId}`),
        this.userService.getList({ meta: { companyId } }),
      ]);
      
      return {
        totalSites: sites.length,
        activeSites: sites.filter(s => s.status === 'active').length,
        totalAdmins: admins.length,
        totalUsers: users.length,
        subscriptionStatus: 'active', // TODO: Get from company
        nextBillingDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}
```

---

## 5. `packages/shared-hooks/`
### Purpose
React hooks that wrap services and encapsulate business logic. **Platform-agnostic, consumed by both web and mobile.**

### Structure
```
packages/shared-hooks/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── useLogin.ts
│   ├── useLogout.ts
│   ├── useCROAdminDashboard.ts
│   ├── useUserList.ts
│   ├── useSiteList.ts
│   └── useFetchData.ts
└── README.md
```

### Example Files

#### `src/useLogin.ts`
```typescript
import { useState } from 'react';
import { AuthResponse } from '@protocolsync/shared-services';

export const useLogin = (authService: any) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    
    try {
      const response = await authService.login();
      console.log('Login successful:', response);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return { isLoggingIn, error, handleLogin };
};
```

#### `src/useCROAdminDashboard.ts`
```typescript
import { useState, useEffect } from 'react';
import { DashboardStats } from '@protocolsync/shared-types';

export const useCROAdminDashboard = (
  dashboardService: any,
  companyId?: string
) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!companyId) return;
    
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await dashboardService.getStats(companyId);
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [companyId, dashboardService]);
  
  return { stats, isLoading, error };
};
```

---

## Package Dependencies

```
┌─────────────────────────────────────────┐
│  shared-types                           │
│  (0 dependencies - pure TypeScript)     │
└─────────────────────────────────────────┘
           ↑                    ↑
           │                    │
┌──────────┴─────────┐  ┌──────┴──────────────┐
│ shared-constants   │  │ shared-utils        │
│ (depends: types)   │  │ (depends: types)    │
└────────┬───────────┘  └────────┬────────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │ shared-services       │
         │ (depends: types,      │
         │ constants, utils)     │
         └──────────┬────────────┘
                    ↓
         ┌───────────────────────┐
         │ shared-hooks          │
         │ (depends: types,      │
         │ services)             │
         └───────────────────────┘
                    ↑
         ┌──────────┴──────────┐
         │                     │
    portal-web            mobile
   (apps)                 (apps)
```

---

## Exporting from Packages

Each package should have a clean public API via `index.ts`:

```typescript
// packages/shared-types/src/index.ts
export * from './api';
export * from './user';
export * from './dashboard';
export * from './errors';

// packages/shared-services/src/index.ts
export { ApiClient } from './api/ApiClient';
export { createApiClient } from './api/apiClient';
export type { IAuthService, AuthResponse } from './auth/AuthService';
export { UserService } from './user/userService';
export { DashboardService } from './dashboard/dashboardService';

// packages/shared-hooks/src/index.ts
export { useLogin } from './useLogin';
export { useCROAdminDashboard } from './useCROAdminDashboard';
export { useUserList } from './useUserList';
```

---

## Consumption in Apps

### Web (`apps/portal-web`)
```typescript
// Import shared types
import { User, DashboardStats } from '@protocolsync/shared-types';

// Import shared services
import { DashboardService } from '@protocolsync/shared-services';

// Import shared hooks
import { useCROAdminDashboard } from '@protocolsync/shared-hooks';

// Use in component
export const CROAdminDashboard = () => {
  const { stats, isLoading } = useCROAdminDashboard(dashboardService, user?.company?.id);
  
  return (
    <CCard>
      {/* CoreUI components */}
    </CCard>
  );
};
```

### Mobile (`apps/mobile`)
```typescript
// Same imports!
import { User, DashboardStats } from '@protocolsync/shared-types';
import { DashboardService } from '@protocolsync/shared-services';
import { useCROAdminDashboard } from '@protocolsync/shared-hooks';

// Use in screen
export const CROAdminDashboard = () => {
  const { stats, isLoading } = useCROAdminDashboard(dashboardService, user?.company?.id);
  
  return (
    <View>
      {/* React Native components */}
    </View>
  );
};
```

---

## Best Practices

1. **Keep packages independent** - shared-types doesn't depend on shared-services
2. **Export interfaces, not implementations** - Allow apps to provide their own instances
3. **Use dependency injection** - Pass services to hooks rather than creating globally
4. **No console.log in libraries** - Use proper logging or let consumers handle it
5. **Document all public APIs** - Add JSDoc comments to exported functions/classes


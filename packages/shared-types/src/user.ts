export interface User {
  id: string;
  azureAdUserId?: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: Role;
  clientId: string;
  client: {
    name: string;
    organizationType: string;
  };
  company?: Company;
  site?: Site;
  roles?: Role[];
  activeRole?: Role;
  permissions?: Permission[];
  lastLogin?: string;
  createdAt?: Date;
}

export interface Company {
  id: string;
  name: string;
  code?: string;
  subscriptionTier?: string;
  subscription?: SubscriptionStatus;
  subscriptionStatus?: string;
}

export interface Site {
  id: string;
  number?: string;
  name: string;
  siteName?: string;
  status?: 'active' | 'inactive';
}

export type Role = 'admin' | 'site_admin' | 'trial_lead' | 'site_user';

export interface Permission {
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete';
}

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

// Alias for compatibility
export type UserProfile = User;

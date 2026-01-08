import { Role } from './user';

export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalAdmins: number;
  totalUsers: number;
  subscriptionStatus?: string;
  nextBillingDate?: string;
}

export interface SiteListItem {
  id: string;
  siteName: string;
  siteNumber?: string;
  status: 'active' | 'inactive';
  trialsCount?: number;
  usersCount?: number;
}

export interface AdminListItem {
  id: string;
  fullName: string;
  displayName?: string;
  email: string;
  role: Role;
}

export interface TrialListItem {
  id: string;
  trialName: string;
  trialNumber?: string;
  status: 'active' | 'inactive' | 'completed';
  siteCount?: number;
}

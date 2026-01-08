import { Role } from '@protocolsync/shared-types';

export const ROLE_LABELS: Record<Role, string> = {
  'admin': 'CRO Administrator',
  'site_admin': 'Site Administrator',
  'trial_lead': 'Trial Lead',
  'site_user': 'Site User',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  'admin': 'Full system access, manage all sites and users',
  'site_admin': 'Manage site-specific users and configurations',
  'trial_lead': 'Lead clinical trial protocols and delegations',
  'site_user': 'Access assigned protocols and reports',
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  'admin': 0,
  'site_admin': 1,
  'trial_lead': 2,
  'site_user': 3,
};

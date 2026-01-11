import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Role } from '@protocolsync/shared-types';
import { ROLE_LABELS } from '@protocolsync/shared-constants';

interface RoleContextType {
  activeRole: Role | null;
  setActiveRole: (role: Role) => void;
  canSwitchRole: boolean;
  availableRoles: { value: Role; label: string }[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);

  // Initialize active role to user's actual role
  useEffect(() => {
    if (user?.role && !activeRole) {
      setActiveRoleState(user.role);
    }
  }, [user?.role, activeRole]);

  // Determine if user can switch roles and what roles are available
  const canSwitchRole = user?.role === 'admin' || user?.role === 'site_admin' || user?.role === 'trial_lead';
  const availableRoles: { value: Role; label: string }[] = [];

  if (user?.role === 'admin') {
    // CRO Admin can switch to Site Admin, Trial Lead, or Site User
    availableRoles.push(
      { value: 'admin', label: ROLE_LABELS['admin'].toUpperCase() },
      { value: 'site_admin', label: ROLE_LABELS['site_admin'].toUpperCase() },
      { value: 'trial_lead', label: ROLE_LABELS['trial_lead'].toUpperCase() },
      { value: 'site_user', label: ROLE_LABELS['site_user'].toUpperCase() }
    );
  } else if (user?.role === 'site_admin') {
    // Site Admin can switch to Trial Lead or Site User
    availableRoles.push(
      { value: 'site_admin', label: ROLE_LABELS['site_admin'].toUpperCase() },
      { value: 'trial_lead', label: ROLE_LABELS['trial_lead'].toUpperCase() },
      { value: 'site_user', label: ROLE_LABELS['site_user'].toUpperCase() }
    );
  } else if (user?.role === 'trial_lead') {
    // Trial Lead can switch to Site User
    availableRoles.push(
      { value: 'trial_lead', label: ROLE_LABELS['trial_lead'].toUpperCase() },
      { value: 'site_user', label: ROLE_LABELS['site_user'].toUpperCase() }
    );
  }

  const setActiveRole = (role: Role) => {
    // Validate that the role is available to the user
    const isValidRole = availableRoles.some(r => r.value === role);
    if (isValidRole || role === user?.role) {
      setActiveRoleState(role);
      console.log('[RoleContext] Active role changed to:', role);
    } else {
      console.warn('[RoleContext] Attempted to set invalid role:', role);
    }
  };

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, canSwitchRole, availableRoles }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

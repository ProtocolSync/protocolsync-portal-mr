import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useUser } from './UserContext';

interface RoleContextType {
  activeRole: string | null;
  setActiveRole: (role: string) => void;
  canSwitchRole: boolean;
  availableRoles: { value: string; label: string }[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [activeRole, setActiveRoleState] = useState<string | null>(null);

  // Initialize active role to user's actual role
  useEffect(() => {
    if (user?.role && !activeRole) {
      setActiveRoleState(user.role);
    }
  }, [user?.role, activeRole]);

  // Determine if user can switch roles and what roles are available
  const canSwitchRole = user?.role === 'admin' || user?.role === 'site_admin' || user?.role === 'trial_lead';
  const availableRoles: { value: string; label: string }[] = [];

  if (user?.role === 'admin') {
    // CRO Admin can switch to Site Admin, Trial Lead, or Site User
    availableRoles.push(
      { value: 'admin', label: 'ADMIN' },
      { value: 'site_admin', label: 'SITE ADMINISTRATOR' },
      { value: 'trial_lead', label: 'TRIAL LEAD' },
      { value: 'site_user', label: 'SITE USER' }
    );
  } else if (user?.role === 'site_admin') {
    // Site Admin can switch to Trial Lead or Site User
    availableRoles.push(
      { value: 'site_admin', label: 'SITE ADMINISTRATOR' },
      { value: 'trial_lead', label: 'TRIAL LEAD' },
      { value: 'site_user', label: 'SITE USER' }
    );
  } else if (user?.role === 'trial_lead') {
    // Trial Lead can switch to Site User
    availableRoles.push(
      { value: 'trial_lead', label: 'TRIAL LEAD' },
      { value: 'site_user', label: 'SITE USER' }
    );
  }

  const setActiveRole = (role: string) => {
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

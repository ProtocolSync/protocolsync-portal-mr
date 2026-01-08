import { useUser } from '../contexts/UserContext';
import { useRole } from '../contexts/RoleContext';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CButton } from '@coreui/react';

export const UserProfileDisplay = () => {
  const { user, loading, error } = useUser();
  const { activeRole, setActiveRole, canSwitchRole, availableRoles } = useRole();
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        mainWindowRedirectUri: window.location.origin
      });
      // After popup logout completes, reload the main window to show login page
      window.location.href = window.location.origin;
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback to redirect if popup fails
      instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin
      });
    }
  };

  const handleRoleModeChange = (newMode: string) => {
    console.log('[UserProfileDisplay] Switching role to:', newMode);
    setActiveRole(newMode);
    
    // Redirect to the appropriate dashboard for the selected role
    navigate('/');
  };

  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">Loading profile...</div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2">
        <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-xs">
          ⚠️ {error.includes('404') ? 'Profile not configured' : 'Profile error'}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayRole = activeRole ? activeRole.replace(/_/g, ' ') : 'No Role';
  const orgName = user.company?.name || user.client?.name || 'No Organization';
  const siteName = user.site?.name;
  const orgDisplay = siteName ? `${siteName}, ${orgName}` : orgName;

  console.log('[UserProfileDisplay] canSwitchRole:', canSwitchRole, 'activeRole:', activeRole, 'availableRoles:', availableRoles);

  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="text-xs text-gray-600">Hello, {user.displayName}</div>
        <div className="text-xs font-bold text-gray-900">{orgDisplay}</div>
      </div>
      
      {canSwitchRole ? (
        <CDropdown variant="btn-group">
          <CDropdownToggle 
            color="success"
            size="sm"
            className="text-xs font-semibold uppercase px-2 py-1 text-white"
            style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
          >
            {displayRole}
          </CDropdownToggle>
          <CDropdownMenu>
            {availableRoles.map((role) => (
              <CDropdownItem
                key={role.value}
                onClick={() => handleRoleModeChange(role.value)}
                active={activeRole === role.value}
                className="text-xs"
              >
                {role.label}
              </CDropdownItem>
            ))}
          </CDropdownMenu>
        </CDropdown>
      ) : (
        <CButton
          color="success"
          size="sm"
          className="text-xs font-semibold uppercase px-2 py-1 text-white"
          style={{ fontSize: '0.75rem', lineHeight: '1rem', cursor: 'default', pointerEvents: 'none' }}
        >
          {displayRole}
        </CButton>
      )}

      <a 
        onClick={handleLogout} 
        className="text-xs font-bold text-blue-600 hover:text-blue-800 no-underline cursor-pointer"
      >
        Sign Out
      </a>
    </div>
  );
}
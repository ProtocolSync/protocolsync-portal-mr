import { Menu } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const CustomMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check user role: admin, site_admin, trial_lead, or site_user
  const isCROAdmin = user?.role === 'admin';
  const isSiteAdmin = user?.role === 'site_admin';
  const isTrialLead = user?.role === 'trial_lead';
  const isSiteUser = user?.role === 'site_user';

  return (
    <Menu>
      <Menu.DashboardItem primaryText="Dashboard" />
      
      {isCROAdmin && (
        /* CRO Admin Menu */
        <>
          <Menu.Item
            to="/sites"
            primaryText="Sites"
            leftIcon={<span>🏥</span>}
            onClick={() => navigate('/sites')}
          />
          
          <Menu.Item
            to="/site-administrators"
            primaryText="Site Administrators"
            leftIcon={<span>👥</span>}
            onClick={() => navigate('/site-administrators')}
          />
          
          <Menu.Item
            to="/users"
            primaryText="Users"
            leftIcon={<span>👤</span>}
            onClick={() => navigate('/users')}
          />
          
          <Menu.Item
            to="/billing"
            primaryText="Billing"
            leftIcon={<span>💳</span>}
            onClick={() => navigate('/billing')}
          />
          
          <Menu.Item
            to="/help"
            primaryText="Help"
            leftIcon={<span>❓</span>}
            onClick={() => navigate('/help')}
          />
        </>
      )}
      
      {isSiteAdmin && (
        /* Site Admin Menu */
        <>
          <Menu.Item
            to="/trials"
            primaryText="Manage Trials"
            leftIcon={<span>🔬</span>}
            onClick={() => navigate('/trials')}
          />

          <Menu.Item
            to="/site-users"
            primaryText="Site Users"
            leftIcon={<span>👥</span>}
            onClick={() => navigate('/site-users')}
          />

          <Menu.Item
            to="/help"
            primaryText="Help"
            leftIcon={<span>❓</span>}
            onClick={() => navigate('/help')}
          />
        </>
      )}

      {isTrialLead && (
        /* Trial Lead Menu */
        <>
          <Menu.Item
            to="/protocols"
            primaryText="Protocol Versions"
            leftIcon={<span>📄</span>}
            onClick={() => navigate('/protocols')}
          />

          <Menu.Item
            to="/delegation-log"
            primaryText="Delegation Log"
            leftIcon={<span>✍️</span>}
            onClick={() => navigate('/delegation-log')}
          />

          <Menu.Item
            to="/help"
            primaryText="Help"
            leftIcon={<span>❓</span>}
            onClick={() => navigate('/help')}
          />
        </>
      )}
      
      {isSiteUser && (
        /* Site User Menu - Only protocols delegated to them */
        <>
          <Menu.Item
            to="/my-protocols"
            primaryText="My Protocols"
            leftIcon={<span>📄</span>}
            onClick={() => navigate('/my-protocols')}
          />
          
          <Menu.Item
            to="/help"
            primaryText="Help"
            leftIcon={<span>❓</span>}
            onClick={() => navigate('/help')}
          />
        </>
      )}
    </Menu>
  );
};

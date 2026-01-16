import { useNavigate } from 'react-router-dom';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CSidebarFooter,
} from '@coreui/react';
import { useRole } from '../contexts/RoleContext';
import { useSidebar } from '../contexts/SidebarContext';
import {
  getCroAdminNavigation,
  getSiteAdminNavigation,
  getTrialLeadNavigation,
  getSiteUserNavigation
} from '../navigation';
import { AppSidebarNav } from './AppSidebarNav';

export const AppSidebar = () => {
  const { activeRole } = useRole();
  const { sidebarShow, setSidebarShow, sidebarUnfoldable, toggleUnfoldable } = useSidebar();
  const navigate = useNavigate();

  // Determine navigation based on active role (not user's actual role)
  let navigation: any[] = [];
  if (activeRole === 'admin') {
    navigation = getCroAdminNavigation();
  } else if (activeRole === 'site_admin') {
    navigation = getSiteAdminNavigation();
  } else if (activeRole === 'trial_lead') {
    navigation = getTrialLeadNavigation();
  } else if (activeRole === 'site_user') {
    navigation = getSiteUserNavigation();
  }

  return (
    <CSidebar
      className="border-end sidebar-brand-green"
      colorScheme="dark"
      position="fixed"
      narrow={sidebarUnfoldable}
      visible={sidebarShow}
      onVisibleChange={setSidebarShow}
    >
      <CSidebarHeader className="border-bottom px-4">
        <CSidebarBrand
          className="cursor-pointer text-decoration-none"
          onClick={() => navigate('/')}
        >
          <div className="sidebar-brand-full">
            <img
              src="/protocolsync-logo.png"
              alt="Protocol Sync"
              className="sidebar-brand-logo h-5 w-auto mr-2"
            />
            <span className="text-white text-lg font-bold uppercase">
              Protocol Sync
            </span>
          </div>
          <img
            className="sidebar-brand-narrow sidebar-brand-logo-narrow h-8 w-auto"
            src="/protocolsync-logo.png"
            alt="PS"
          />
        </CSidebarBrand>
      </CSidebarHeader>
      <CSidebarNav>
        <AppSidebarNav items={navigation} />
      </CSidebarNav>
      <CSidebarFooter className="border-top d-none d-lg-flex justify-content-end">
        <CSidebarToggler onClick={toggleUnfoldable} />
      </CSidebarFooter>
    </CSidebar>
  );
};

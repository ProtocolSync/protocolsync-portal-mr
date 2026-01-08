import { CContainer, CHeader, CHeaderNav, CHeaderToggler } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu } from '@coreui/icons';
import { UserProfileDisplay } from './UserProfileDisplay';
import { AppBreadcrumb } from './AppBreadcrumb';
import { useSidebar } from '../contexts/SidebarContext';

export const AppHeader = () => {
  const { toggleSidebar } = useSidebar();
  
  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer fluid className="border-bottom px-4">
        <CHeaderToggler
          className="ps-1"
          style={{ marginInlineStart: '-14px' }}
          onClick={toggleSidebar}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="d-none d-md-flex">
          <AppBreadcrumb />
        </CHeaderNav>
        <CHeaderNav className="ms-auto">
          <UserProfileDisplay />
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

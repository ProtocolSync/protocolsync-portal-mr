import { NavLink } from 'react-router-dom';
import { CBadge, CNavLink, CNavTitle } from '@coreui/react';

interface NavItem {
  component: any;
  name: string;
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: {
    color: string;
    text: string;
  };
}

interface AppSidebarNavProps {
  items: NavItem[];
}

export const AppSidebarNav = ({ items }: AppSidebarNavProps) => {
  const navItem = (item: NavItem, index: number) => {
    const { component: Component, name, badge, icon, to, onClick } = item;

    return (
      <Component as="div" key={index}>
        {to ? (
          <CNavLink as={NavLink} to={to}>
            {icon && icon}
            {name}
            {badge && (
              <CBadge color={badge.color} className="ms-auto">
                {badge.text}
              </CBadge>
            )}
          </CNavLink>
        ) : onClick ? (
          <CNavLink onClick={onClick} style={{ cursor: 'pointer' }}>
            {icon && icon}
            {name}
            {badge && (
              <CBadge color={badge.color} className="ms-auto">
                {badge.text}
              </CBadge>
            )}
          </CNavLink>
        ) : (
          <>
            {icon && icon}
            {name}
            {badge && (
              <CBadge color={badge.color} className="ms-auto">
                {badge.text}
              </CBadge>
            )}
          </>
        )}
      </Component>
    );
  };

  const navTitle = (item: NavItem, index: number) => {
    const { component: Component, name } = item;
    return (
      <Component key={index}>
        {name}
      </Component>
    );
  };

  return (
    <>
      {items.map((item, index) =>
        item.component === CNavTitle
          ? navTitle(item, index)
          : navItem(item, index)
      )}
    </>
  );
};

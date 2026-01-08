import { useLocation } from 'react-router-dom';
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react';

// Simple route name mapping
const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/sites': 'Sites',
  '/site-administrators': 'Site Administrators',
  '/users': 'Users',
  '/billing': 'Billing',
  '/help': 'Help',
  '/protocols': 'Protocol Versions',
  '/delegation-log': 'Delegation Log',
  '/site-users': 'Site Users',
  '/my-protocols': 'My Protocols',
};

export const AppBreadcrumb = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const getBreadcrumbs = () => {
    const breadcrumbs: Array<{ pathname: string; name: string; active: boolean }> = [];
    const paths = pathname.split('/').filter(Boolean);
    
    paths.reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`;
      const routeName = routeNames[currentPathname];
      
      if (routeName) {
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length,
        });
      }
      
      return currentPathname;
    }, '');
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <CBreadcrumb className="my-0 ms-2">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
          key={index}
        >
          {breadcrumb.name}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  );
};

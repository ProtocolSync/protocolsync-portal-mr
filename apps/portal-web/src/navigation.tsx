import { CNavItem, CNavTitle } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilBuilding,
  cilPeople,
  cilUser,
  cilCreditCard,
  cilLifeRing,
  cilNotes,
  cilInfo,
  cilMedicalCross,
  cilDescription,
  cilClipboard,
  cilChart,
} from '@coreui/icons';

// Navigation configuration for different user roles
export const getCroAdminNavigation = () => [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Management',
  },
  {
    component: CNavItem,
    name: 'Sites',
    to: '/sites',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Site Administrators',
    to: '/site-administrators',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Users',
    to: '/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Compliance',
  },
  {
    component: CNavItem,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Account',
  },
  {
    component: CNavItem,
    name: 'Billing',
    to: '/billing',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Help',
    onClick: () => window.dispatchEvent(new Event('openHelpChat')),
    icon: <CIcon icon={cilLifeRing} customClassName="nav-icon" />,
  },
];

export const getSiteAdminNavigation = () => [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Trials',
  },
  {
    component: CNavItem,
    name: 'Manage Trials',
    to: '/trials',
    icon: <CIcon icon={cilMedicalCross} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Management',
  },
  {
    component: CNavItem,
    name: 'Site Users',
    to: '/site-users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Compliance',
  },
  {
    component: CNavItem,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Support',
  },
  {
    component: CNavItem,
    name: 'Help',
    onClick: () => window.dispatchEvent(new Event('openHelpChat')),
    icon: <CIcon icon={cilInfo} customClassName="nav-icon" />,
  },
];

export const getTrialLeadNavigation = () => [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Trial Management',
  },
  {
    component: CNavItem,
    name: 'Protocol Versions',
    to: '/protocols',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Delegation Log',
    to: '/delegation-log',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Support',
  },
  {
    component: CNavItem,
    name: 'Help',
    onClick: () => window.dispatchEvent(new Event('openHelpChat')),
    icon: <CIcon icon={cilInfo} customClassName="nav-icon" />,
  },
];

export const getSiteUserNavigation = () => [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Protocols',
  },
  {
    component: CNavItem,
    name: 'My Protocols',
    to: '/my-protocols',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Support',
  },
  {
    component: CNavItem,
    name: 'Help',
    onClick: () => window.dispatchEvent(new Event('openHelpChat')),
    icon: <CIcon icon={cilInfo} customClassName="nav-icon" />,
  },
];

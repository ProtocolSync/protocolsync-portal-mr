# Portal Mobile - Pages Implementation

## Overview

All the main pages from portal-web have been successfully implemented for portal-mobile with React Native equivalents. The pages use the same business logic and API endpoints as the web version but with mobile-optimized UI components.

## Implemented Pages

### 1. Sites (`/screens/SitesScreen.tsx`)
- **Features:**
  - List of trial sites with search functionality
  - Pull-to-refresh support
  - Mobile-optimized card view
  - Site detail modal
  - Status badges (Active/Inactive)
  - FAB (Floating Action Button) for adding sites (admin only)

- **API Endpoint:** `GET /sites?company_id={companyId}`
- **Navigation:** Accessible from sidebar under "MANAGEMENT" section for admin users

### 2. Site Administrators (`/screens/SiteAdministratorsScreen.tsx`)
- **Features:**
  - List of site administrators with search
  - Avatar display with initials
  - Pull-to-refresh support
  - Administrator detail modal
  - Status badges
  - FAB for adding administrators (admin only)

- **API Endpoint:** `GET /companies/{companyId}/administrators`
- **Navigation:** Accessible from sidebar under "MANAGEMENT" section for admin users

### 3. Users (`/screens/UsersScreen.tsx`)
- **Features:**
  - User management interface with search
  - Role-based color-coded avatars
  - Status badges (Active/Pending/Inactive)
  - User detail modal with assigned sites
  - Pull-to-refresh support
  - FAB for adding users (admin only)

- **API Endpoint:** `GET /companies/{companyId}/users`
- **Navigation:** Accessible from sidebar under "MANAGEMENT" section for admin users

### 4. Reports (`/screens/ReportsScreen.tsx`)
- **Features:**
  - FDA 21 CFR Part 11 compliant report generation
  - Multiple report types (Delegation Log, System Access, etc.)
  - Date range selection
  - Audit trail toggle
  - Report polling and download
  - File sharing integration

- **API Endpoints:**
  - `POST /reports/{reportType}`
  - `GET /reports/status/{reportId}`
  - `GET /reports/download/{reportId}`
- **Navigation:** Accessible from sidebar under "COMPLIANCE" section

### 5. Billing (`/screens/BillingScreen.tsx`)
- **Features:**
  - Tabbed interface (Overview, Payment, Invoices)
  - Subscription management
  - Payment method display
  - Invoice history with download links
  - Trial status indicators
  - Pull-to-refresh support

- **API Endpoints:**
  - `GET /companies/{companyId}/subscription`
  - `GET /companies/{companyId}/payment-methods`
  - `GET /companies/{companyId}/invoices`
- **Navigation:** Accessible from sidebar under "ACCOUNT" section for admin users

### 6. Help (`/screens/HelpScreen.tsx`)
- **Features:**
  - AI-powered chat assistant
  - Real-time conversation interface
  - Message history
  - Source citations
  - Quick action buttons
  - Keyboard-aware scrolling

- **API Endpoint:** `POST /help/chat`
- **Navigation:** Accessible from sidebar under "ACCOUNT/SUPPORT" section for all users

## Common Components Created

### 1. EmptyState (`/components/common/EmptyState.tsx`)
- Displays when no data is available
- Includes icon, title, message, and optional action button

### 2. LoadingState (`/components/common/LoadingState.tsx`)
- Consistent loading indicator across all screens
- Customizable loading message

### 3. ErrorState (`/components/common/ErrorState.tsx`)
- Error display with retry functionality
- User-friendly error messaging

## Services

### API Service (`/services/api.ts`)
- Centralized API client for all HTTP requests
- Automatic MSAL token integration
- Built-in error handling
- Support for GET, POST, PUT, DELETE, and file uploads
- Mirrors portal-web API service but adapted for React Native

## Navigation Updates

### AppNavigator (`/navigation/AppNavigator.tsx`)
All screens have been registered in the DrawerNavigator:
- Home (Dashboard)
- Sites
- Site Administrators (Admins)
- Users
- Reports
- Billing
- Help

### AppSidebar (`/components/common/AppSidebar.tsx`)
- Navigation now properly routes to all registered screens
- Role-based menu items (admin, site_admin, trial_lead, site_user)
- Sections organized by functionality (MANAGEMENT, COMPLIANCE, ACCOUNT)

## Dependencies Added

New packages added to `package.json`:
- `@react-native-picker/picker` - For dropdown selections in Reports
- `expo-sharing` - For sharing downloaded reports
- `expo-constants` - Already included but explicitly added

## Next Steps (TODOs)

The following features are placeholders for future implementation:

1. **Add Modals:**
   - Add Site modal
   - Add Site Administrator modal
   - Add User modal

2. **Subscription Management:**
   - Plan selection
   - Payment method management (Stripe integration)
   - Subscription cancellation

3. **Invoice Downloads:**
   - Direct PDF download from invoice list

4. **Enhanced Report Features:**
   - Better date picker UI
   - Progress indicators for long-running reports

5. **Help Chat Enhancements:**
   - Conversation persistence
   - Escalation to human support

## Running the App

1. Install dependencies:
   ```bash
   cd apps/portal-mobile
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device/simulator:
   - iOS: `npm run ios`
   - Android: `npm run android`

## Business Logic Compatibility

All screens use the same:
- API endpoints as portal-web
- Data models and interfaces
- Authentication flow (MSAL + JWT)
- Multi-tenancy filtering (by company_id)
- Role-based access control

The only differences are the UI components (React Native instead of React Admin/CoreUI) and mobile-optimized layouts.

## File Structure

```
apps/portal-mobile/src/
├── components/
│   └── common/
│       ├── AppSidebar.tsx
│       ├── AppHeader.tsx
│       ├── AppFooter.tsx
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       └── ErrorState.tsx
├── contexts/
│   └── AuthContext.tsx
├── navigation/
│   └── AppNavigator.tsx
├── screens/
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── SitesScreen.tsx
│   ├── SiteAdministratorsScreen.tsx
│   ├── UsersScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── BillingScreen.tsx
│   └── HelpScreen.tsx
├── services/
│   └── api.ts
└── config/
    ├── env.ts
    └── authConfig.ts
```

## Notes

- All screens support pull-to-refresh
- Search functionality is client-side for better mobile UX
- Modals are used for detail views to save screen space
- FAB buttons are only visible to users with appropriate permissions
- Color scheme matches portal-web design tokens
- All components are fully typed with TypeScript

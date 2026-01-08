# Role-Based Portal Implementation

## Overview

The ProtocolSync portal has been updated to support two distinct user experiences:

1. **CRO Admins** (company_admin, system_admin) - Manage multiple sites, administrators, and billing
2. **Site Administrators** - Manage protocols, delegation logs, and site users

## User Roles

### CRO Admin Roles
- `company_admin` - Company administrators who manage sites
- `system_admin` - System-level administrators with full access

### Site Admin Roles
- All other roles (investigator, site_user, coordinator, etc.) see the site-level view

## New Components Created

### For CRO Admins

#### 1. **Sites.tsx** - Site Management
- **Location**: `/src/components/Sites.tsx`
- **Route**: `/sites`
- **Features**:
  - Grid view of all sites with status indicators
  - Filter sites by status (active, on_hold, inactive, closed)
  - Add new sites via modal (integrated with API)
  - Click on site to view details
  - Shows site information from backend API
  - Real-time data fetching from `/api/v1/companies/:companyId/sites`
  - Create new sites via `/api/v1/companies/:companyId/sites` POST endpoint
  - Loading and error states
  - Automatic refresh after creating new site

#### 2. **SiteDetail.tsx** - Individual Site View
- **Location**: `/src/components/SiteDetail.tsx`
- **Route**: `/sites/:id`
- **Features**:
  - Tabbed interface (Overview, Admins, Protocols)
  - Site information display
  - Manage site administrators
  - View site statistics
  - Drill down to protocol versions (links to existing views)

#### 3. **AddSiteModal.tsx** - Add Site Form
- **Location**: `/src/components/AddSiteModal.tsx`
- **Features**:
  - Modal form for adding new sites
  - Validates required fields
  - Captures site information per API requirements:
    - Site number (unique identifier)
    - Site name
    - Institution name (for FDA documentation)
    - Full address (address_line1, city, state_province, postal_code, country)
  - Automatically includes user context (created_by_user_id, requester_account_type)
  - Integrates with backend POST endpoint

#### 4. **SiteAdministrators.tsx** - Manage All Site Admins
- **Location**: `/src/components/SiteAdministrators.tsx`
- **Route**: `/site-administrators`
- **Features**:
  - List all administrators across all sites
  - Filter by status (active, pending, inactive)
  - Add new administrators
  - Edit/deactivate administrators
  - Shows which site each admin belongs to

#### 5. **Billing.tsx** - Billing & Subscription Management
- **Location**: `/src/components/Billing.tsx`
- **Route**: `/billing`
- **Features**:
  - Three tabs: Overview, Payment, Invoices
  - Current subscription information
  - Payment method management with Stripe integration
  - Invoice history with download options
  - Usage statistics (sites, admins, protocols)

#### 6. **StripePaymentForm.tsx** - PCI-Compliant Payment Form
- **Location**: `/src/components/StripePaymentForm.tsx`
- **Features**:
  - Stripe Elements integration for PCI compliance
  - Secure card information collection
  - Cardholder name input
  - Visual security indicators
  - Error handling and validation

#### 7. **CROAdminDashboard.tsx** - CRO Admin Dashboard
- **Location**: `/src/components/CROAdminDashboard.tsx`
- **Route**: `/` (when logged in as CRO admin)
- **Features**:
  - Overview statistics (sites, admins, protocols, revenue)
  - Quick action buttons
  - Recent activity feed
  - Clickable stats cards that navigate to relevant sections

## Updated Components

### App.tsx
- **Changes**:
  - Added `DashboardRouter` component that selects dashboard based on user role
  - Added routes for CRO admin features (sites, site-administrators, billing)
  - Imports all new components

### CustomMenu.tsx
- **Changes**:
  - Conditional menu rendering based on `isCROAdmin` flag
  - **CRO Admin Menu** shows:
    - Dashboard
    - Sites
    - Site Administrators
    - Billing
    - Help
  - **Site Admin Menu** shows:
    - Dashboard
    - Protocol Versions
    - Delegation Log
    - Users (if authorized)
    - Help

## Role Detection Logic

```typescript
const isCROAdmin = 
  user?.accountType === 'company_admin' || 
  user?.accountType === 'system_admin' || 
  user?.role === 'company_admin';
```

This checks both `accountType` and `role` fields to ensure compatibility with existing and new user structures.

## Stripe Integration

### Setup Required

1. **Environment Variable**: Add to `.env` file:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
   ```

2. **Dependencies Installed**:
   - `@stripe/stripe-js`
   - `@stripe/react-stripe-js`

### PCI Compliance

The `StripePaymentForm` component uses Stripe Elements, which:
- Never exposes raw card data to your application
- Handles PCI compliance automatically
- Encrypts card information before transmission
- Meets PCI DSS SAQ A compliance requirements

### Backend Integration Needed

The current implementation creates a payment method but needs backend API endpoints to:
- Save the payment method to the customer
- Process subscription payments
- Generate invoices
- Handle webhooks for payment events

## Navigation Flow

### CRO Admin Flow
```
Dashboard → View Stats
         → Sites → Site Detail → View Protocols/Admins
         → Site Administrators → Add/Edit Admins
         → Billing → Manage Subscription/Payment
```

### Site Admin Flow
```
Dashboard → View Compliance
         → Protocol Versions → Upload/Manage
         → Delegation Log → Create/Sign
         → Users → Manage Site Users
```

## Data Structure

### Site (Backend API Response)
```typescript
interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
  institution_name?: string;
  address_line1?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  status: 'active' | 'inactive' | 'on_hold' | 'closed';
  created_at: string;
  updated_at?: string;
}
```

### Site Form Data (For Creating New Sites)
```typescript
interface SiteFormData {
  site_number: string;
  site_name: string;
  institution_name: string;
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}
```

### Site Administrator
```typescript
interface SiteAdministrator {
  id: string;
  name: string;
  email: string;
  siteId: string;
  siteName: string;
  siteNumber: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
}
```

### Billing Info
```typescript
interface BillingInfo {
  companyName: string;
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  monthlyPrice: number;
  nextBillingDate: string;
  paymentMethod: {
    type: 'card';
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}
```

## Backend API Endpoints Needed

### Sites (✅ Implemented - See FRONTEND_INTEGRATION.md)
- `GET /api/v1/companies/:companyId/sites` - List all sites for company (with filters)
- `POST /api/v1/companies/:companyId/sites` - Create new site
- `GET /api/v1/companies/:companyId/sites/:siteId` - Get site details
- `PUT /api/v1/companies/:companyId/sites/:siteId` - Update site
- `DELETE /api/v1/companies/:companyId/sites/:siteId` - Delete/deactivate site
- `POST /api/v1/companies/:companyId/sites/:siteId/administrator` - Assign site administrator

### Site Administrators
- `GET /api/v1/site-administrators` - List all site admins
- `POST /api/v1/site-administrators` - Add site admin
- `PUT /api/v1/site-administrators/:id` - Update site admin
- `DELETE /api/v1/site-administrators/:id` - Remove site admin

### Billing
- `GET /api/v1/billing/subscription` - Get subscription details
- `PUT /api/v1/billing/subscription` - Update subscription
- `POST /api/v1/billing/payment-method` - Add/update payment method
- `GET /api/v1/billing/invoices` - List invoices
- `GET /api/v1/billing/invoices/:id/download` - Download invoice PDF

### Stripe Webhooks
- `POST /api/v1/webhooks/stripe` - Handle Stripe events
  - `payment_intent.succeeded`
  - `payment_intent.failed`
  - `customer.subscription.updated`
  - `invoice.payment_succeeded`

## Testing the Implementation

### As CRO Admin
1. Log in with a user that has `accountType: 'company_admin'`
2. Verify you see the CRO Admin Dashboard
3. Check menu shows Sites, Site Administrators, Billing
4. Navigate to Sites and test adding a site
5. Navigate to Site Administrators
6. Navigate to Billing and test payment form (test mode)

### As Site Admin
1. Log in with a user that has `accountType: 'site_user'` or similar
2. Verify you see the Operational Dashboard
3. Check menu shows Protocol Versions, Delegation Log, Users
4. Verify no access to Sites or Billing routes

## Security Considerations

1. **Route Protection**: Currently all routes are accessible if you know the URL. Consider adding route-level permission checks.
2. **API Authorization**: Backend must verify user has permission to access/modify data
3. **Stripe Keys**: Use test keys for development, live keys only in production
4. **Payment Data**: Never log or store raw card data
5. **Multi-tenancy**: Ensure data isolation between companies/sites

## Next Steps

1. **Backend Integration**: Connect components to real API endpoints
2. **Stripe Backend**: Implement Stripe backend integration
3. **Route Guards**: Add permission-based route protection
4. **Testing**: Create comprehensive tests for role-based views
5. **Error Handling**: Add better error states and loading indicators
6. **Notifications**: Add success/error notifications for actions
7. **Audit Logging**: Log CRO admin actions (site creation, admin changes)

## Files Modified/Created

### Created
- `/src/components/Sites.tsx`
- `/src/components/SiteDetail.tsx`
- `/src/components/AddSiteModal.tsx`
- `/src/components/SiteAdministrators.tsx`
- `/src/components/Billing.tsx`
- `/src/components/StripePaymentForm.tsx`
- `/src/components/CROAdminDashboard.tsx`

### Modified
- `/src/App.tsx` - Added role-based routing and new routes
- `/src/components/CustomMenu.tsx` - Added conditional menu based on role

### Dependencies Added
- `@stripe/stripe-js`
- `@stripe/react-stripe-js`

# Mobile Project Migration Assessment

**Date**: January 8, 2026
**Assessment**: Comparison between abandoned mobile project and Phase 5 requirements

---

## Executive Summary

The previous `protocolsync-mobile` project (abandoned) completed approximately **5% of the total portal features**. It successfully implemented:
- ✅ Login screen with Azure AD
- ✅ Basic CRO Admin Dashboard
- ✅ Design tokens integration
- ✅ Authentication context

However, it was abandoned due to **code duplication complexity** from trying to build outside the monorepo structure. With the monorepo now complete (Phase 0-4), we can leverage 5 shared packages to build the mobile app efficiently without duplication.

---

## Feature Comparison Matrix

| Feature Category | Old Mobile Project | Web Portal | Phase 5 Target | Completion |
|-----------------|-------------------|------------|----------------|------------|
| **Authentication** | ✅ Partial | ✅ Complete | ✅ Complete | 40% |
| **CRO Admin Dashboard** | ⚠️ Basic | ✅ Complete | ✅ Complete | 30% |
| **Site Admin Dashboard** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Trial Lead Dashboard** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Site User Dashboard** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Trial Management** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Site Management** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **User Management** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Site User Management** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Site Admin Management** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Protocol Versions** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **My Protocols** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Delegation Log** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Reports (5 types)** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Billing/Subscriptions** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Payment Methods** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Invoices** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Help Chat Widget** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **File Upload** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **File Download** | ❌ None | ✅ Complete | ✅ Complete | 0% |
| **Navigation Structure** | ⚠️ Basic | ✅ Complete | ✅ Complete | 20% |
| **UI Component Library** | ⚠️ Minimal | ✅ Complete | ✅ Complete | 15% |

**Overall Completion: ~5%**

---

## Detailed Feature Analysis

### 1. Authentication & User Context

#### Old Mobile Project Status: ✅ Partial (40%)

**What Exists:**
```typescript
// src/contexts/AuthContext.tsx
- Azure AD authentication via react-native-msal
- Login/logout functions
- User state management
- Loading and error states
- Token storage in AsyncStorage
```

**What's Missing:**
- Role switching UI
- Session timeout detection
- Auto-logout on token expiration
- User profile screen
- Integration with monorepo's @protocolsync/shared-hooks

**Migration Path:**
1. Keep existing AuthContext structure
2. Replace custom auth logic with `useLogin()` from @protocolsync/shared-hooks
3. Add `UserContext` from shared packages
4. Implement session management
5. Add role switching UI

---

### 2. CRO Admin Dashboard

#### Old Mobile Project Status: ⚠️ Basic (30%)

**What Exists:**
```typescript
// src/components/dashboards/CROAdminDashboard.tsx
- Basic stats display (Total Sites, Active Sites, Admins, Users)
- Card-based layout
- Pull-to-refresh
- Loading states
- Error handling
```

**What's Missing:**
- Quick action cards (Manage Sites, Admins, Users, Billing)
- Clickable stats navigation
- Billing status display (next billing date)
- Real-time updates
- Empty states

**Migration Path:**
1. Enhance existing CROAdminDashboard with quick actions
2. Add navigation to respective screens
3. Add billing status card
4. Use shared data hooks from monorepo

---

### 3. Site Admin Dashboard

#### Old Mobile Project Status: ❌ None (0%)

**What's Missing:**
- Active trials overview
- Trial cards with badges
- Phase/status visualization
- Quick action cards
- Site summary stats

**Migration Path:**
1. Create SiteAdminDashboard.tsx from scratch
2. Implement trial cards with badges
3. Add quick actions
4. Integrate with trials API
5. Use design tokens for consistency

---

### 4. Trial Lead Dashboard

#### Old Mobile Project Status: ❌ None (0%)

**What's Missing:**
- My assigned trials overview
- Trial role badges
- Quick actions (Protocols, Delegation Log)
- Trial count display

**Migration Path:**
1. Create TrialLeadDashboard.tsx
2. Fetch assigned trials from API
3. Display trial cards with role info
4. Add navigation to protocols/delegation

---

### 5. Site User Dashboard

#### Old Mobile Project Status: ❌ None (0%)

**What's Missing:**
- Delegated protocols list
- Version badges
- Status badges
- Accept/decline actions

**Migration Path:**
1. Create SiteUserDashboard.tsx
2. Fetch delegated protocols
3. Display protocol cards
4. Add delegation acceptance UI

---

### 6. Navigation Structure

#### Old Mobile Project Status: ⚠️ Basic (20%)

**What Exists:**
```typescript
// src/navigation/AppNavigator.tsx
- Basic stack navigator
- Auth flow handling
- Screen transitions
```

**What's Missing:**
- Drawer navigation (sidebar)
- Role-based navigation
- Deep linking
- Navigation guards
- Tab navigation (for sub-sections)
- Bottom tabs (alternative pattern)

**Migration Path:**
1. Extend existing navigator with drawer
2. Add role-based navigation items
3. Implement deep linking
4. Add navigation guards per role

---

### 7. UI Component Library

#### Old Mobile Project Status: ⚠️ Minimal (15%)

**What Exists:**
```typescript
// Using React Native Paper
- Card (from RN Paper)
- Basic styling with design tokens
```

**What's Missing:**
- Custom Button components
- Badge/Chip components
- Form inputs (Input, Select, DatePicker)
- Bottom sheets
- Toast notifications
- Alert dialogs
- List components
- Empty/error states
- Loading spinners
- FAB (Floating Action Button)
- Search bar
- Filter sheets

**Migration Path:**
1. Build comprehensive component library
2. Mirror web CoreUI components in RN
3. Use design tokens from @protocolsync/shared-styles
4. Follow React Native Paper theming

---

### 8. Screens Needed (Not Started)

**Total: 40+ screens**

#### Trial Management (0/6)
- [ ] TrialsListScreen
- [ ] TrialDetailScreen
- [ ] AddTrialScreen
- [ ] TrialStatusSheet
- [ ] AssignTrialLeadScreen
- [ ] TrialFiltersSheet

#### Site Management (0/4)
- [ ] SitesListScreen
- [ ] SiteDetailScreen
- [ ] AddSiteScreen
- [ ] SiteStatusSheet

#### User Management (0/8)
- [ ] UsersListScreen (CRO Admin)
- [ ] UserDetailScreen
- [ ] SiteUsersListScreen (Site Admin)
- [ ] SiteUserDetailScreen
- [ ] AddUserScreen
- [ ] AssignUserToTrialScreen
- [ ] SiteAdministratorsListScreen
- [ ] AddEditAdminScreen

#### Protocol Management (0/6)
- [ ] ProtocolVersionsListScreen
- [ ] ProtocolDetailScreen
- [ ] ProtocolUploadScreen
- [ ] MyProtocolsListScreen (Site User)
- [ ] ProtocolViewScreen
- [ ] ProtocolChatScreen

#### Compliance (0/5)
- [ ] DelegationLogScreen
- [ ] DelegationDetailScreen
- [ ] ReportsScreen
- [ ] ReportConfigScreen
- [ ] ReportPreviewScreen

#### Billing (0/6)
- [ ] BillingScreen (tabs)
- [ ] SubscriptionTab
- [ ] PaymentMethodsTab
- [ ] InvoicesTab
- [ ] AddPaymentMethodScreen
- [ ] InvoiceDetailScreen

#### Support (0/2)
- [ ] HelpChatScreen
- [ ] UserProfileScreen

---

## Code Reusability Assessment

### From Old Mobile Project (Can Reuse)

**High Reusability (80%+):**
- ✅ LoginScreen.tsx - Minor updates needed
- ✅ AuthContext.tsx - Integrate with shared hooks
- ✅ design-tokens.json usage pattern - Replace with shared-styles
- ✅ AppNavigator.tsx structure - Extend with drawer

**Medium Reusability (50%+):**
- ⚠️ CROAdminDashboard.tsx - Needs enhancement
- ⚠️ Basic API fetch patterns - Replace with shared ApiClient

**Low Reusability (<50%):**
- ❌ package.json dependencies - Outdated, needs update
- ❌ Local @protocolsync/core reference - Replace with monorepo packages

### From Monorepo Shared Packages (Reuse 100%)

**From @protocolsync/shared-types:**
- ✅ User, Role, Company, Site types
- ✅ Trial, Protocol, Delegation types
- ✅ API request/response types
- ✅ Dashboard statistics types

**From @protocolsync/shared-constants:**
- ✅ API_ENDPOINTS
- ✅ ROLE_LABELS, ROLE_HIERARCHY
- ✅ getApiBaseUrl()

**From @protocolsync/shared-utils:**
- ✅ validateEmail, validatePassword
- ✅ formatDate, formatFullName
- ✅ Validation functions

**From @protocolsync/shared-services:**
- ✅ ApiClient (platform-agnostic)
- ✅ IAuthService interface

**From @protocolsync/shared-hooks:**
- ✅ useLogin()
- ⏳ Add more hooks (useDashboard, useTrials, etc.)

**From @protocolsync/shared-styles:**
- ✅ Design tokens (colors, spacing, typography)

---

## Architecture Differences

### Old Mobile Project Architecture

```
protocolsync-mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx ✅
│   │   └── HomeScreen.tsx ⚠️
│   ├── components/
│   │   └── dashboards/
│   │       ├── CROAdminDashboard.tsx ⚠️
│   │       ├── SiteAdminDashboard.tsx ❌ (empty)
│   │       └── SiteUserDashboard.tsx ❌ (empty)
│   ├── contexts/
│   │   └── AuthContext.tsx ✅
│   ├── navigation/
│   │   └── AppNavigator.tsx ⚠️
│   ├── config/
│   │   ├── env.ts
│   │   └── authConfig.ts
│   ├── adapters/
│   │   └── platform.ts
│   └── design-tokens.json
└── package.json (local @protocolsync/core link)
```

**Issues:**
- ❌ Tried to import from `../protocolsync-portal/src/core` (brittle)
- ❌ No shared packages (code duplication)
- ❌ Only 2 functional screens
- ❌ Incomplete navigation
- ❌ No component library

### New Monorepo Architecture (Phase 5)

```
protocolsync-monorepo/
├── apps/
│   ├── portal-web/ ✅ (complete)
│   └── portal-mobile/ ⏳ (Phase 5)
│       ├── src/
│       │   ├── screens/ (40+ screens)
│       │   ├── components/ (50+ components)
│       │   ├── navigation/
│       │   ├── contexts/
│       │   └── adapters/
│       └── package.json (monorepo deps)
│
└── packages/
    ├── shared-types/ ✅
    ├── shared-constants/ ✅
    ├── shared-utils/ ✅
    ├── shared-services/ ✅
    ├── shared-hooks/ ✅
    └── shared-styles/ ✅
```

**Benefits:**
- ✅ Clean imports from `@protocolsync/shared-*`
- ✅ No code duplication
- ✅ Shared business logic
- ✅ Consistent types
- ✅ Single source of truth

---

## Dependencies Comparison

### Old Mobile Project (protocolsync-mobile)

```json
{
  "dependencies": {
    "@azure/msal-browser": "^4.27.0",
    "@protocolsync/core": "file:../protocolsync-portal/src/core", ❌ Brittle
    "@protocolsync/shared-styles": "file:../protocolsync-shared-styles", ⚠️ OK
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/drawer": "^6.6.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "expo": "~54.0.30",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-msal": "^4.0.4",
    "react-native-paper": "^5.12.5"
  }
}
```

### New Monorepo Mobile App (Phase 5)

```json
{
  "dependencies": {
    "@protocolsync/shared-types": "*", ✅ Monorepo
    "@protocolsync/shared-constants": "*", ✅ Monorepo
    "@protocolsync/shared-utils": "*", ✅ Monorepo
    "@protocolsync/shared-services": "*", ✅ Monorepo
    "@protocolsync/shared-hooks": "*", ✅ Monorepo
    "@protocolsync/shared-styles": "*", ✅ Monorepo
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/drawer": "^6.6.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "expo": "~54.0.30",
    "expo-document-picker": "~12.0.2", ✅ File upload
    "expo-file-system": "~18.0.4", ✅ File download
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-msal": "^4.0.4",
    "react-native-paper": "^5.12.5"
  }
}
```

**Changes:**
- ✅ Replace `@protocolsync/core` with 5 shared packages
- ✅ Add file handling dependencies
- ✅ Use npm workspace dependencies

---

## Migration Strategy

### Phase 1: Foundation Setup (Week 1-2)

**Tasks:**
1. Create `apps/portal-mobile/` directory in monorepo
2. Initialize Expo app with TypeScript
3. Configure package.json with monorepo dependencies
4. Set up navigation (drawer + stack)
5. Migrate LoginScreen from old project
6. Update AuthContext to use shared hooks
7. Test authentication flow

**From Old Project:**
- Copy LoginScreen.tsx (update styling)
- Copy AuthContext.tsx (integrate with shared-hooks)
- Copy navigation structure (extend)

**New Work:**
- Link 5 shared packages
- Create mobile adapters (storage, environment)
- Set up Expo config
- Create component library foundation

### Phase 2: Dashboards (Week 3-4)

**Tasks:**
1. Enhance CROAdminDashboard (from old project)
2. Create SiteAdminDashboard from scratch
3. Create TrialLeadDashboard from scratch
4. Create SiteUserDashboard from scratch
5. Add role-based navigation
6. Implement quick action cards

**From Old Project:**
- CROAdminDashboard.tsx (enhance)

**New Work:**
- 3 new dashboards
- Dashboard data hooks
- Stats cards components
- Quick action navigation

### Phase 3-7: Features (Week 5-14)

**All New Work:**
- 40+ screens to create
- 50+ components to build
- File handling system
- Offline support
- Reports generation
- Billing integration
- Help chat widget

---

## Estimated Effort

### Old Mobile Project Investment

- **Time Spent**: ~2 weeks
- **Lines of Code**: ~2,000 LOC
- **Screens Completed**: 2 of 42 (5%)
- **Features Completed**: 2 of 20 (10%)

### Phase 5 Remaining Work

- **Estimated Time**: 14 weeks (3.5 months)
- **Estimated LOC**: ~20,000 LOC
- **Screens to Build**: 40+ screens
- **Features to Build**: 18 major features

### Reusability from Old Project

- **Code Reuse**: ~15% (auth + basic dashboard)
- **Architectural Lessons**: High value
- **Design Patterns**: Reusable
- **Time Savings**: ~1 week (avoid mistakes)

---

## Risk Mitigation

### Risks from Old Project

**Risk 1: Code Duplication**
- Old Project: ❌ Failed (tried to link portal/src/core)
- Phase 5: ✅ Mitigated (monorepo shared packages)

**Risk 2: Business Logic Inconsistency**
- Old Project: ❌ Would diverge over time
- Phase 5: ✅ Mitigated (shared hooks/services)

**Risk 3: Design Inconsistency**
- Old Project: ⚠️ Separate design-tokens.json
- Phase 5: ✅ Mitigated (shared-styles package)

**Risk 4: Type Safety**
- Old Project: ⚠️ Local type definitions
- Phase 5: ✅ Mitigated (shared-types package)

### New Risks in Phase 5

**Risk 1: Large Codebase Complexity**
- Mitigation: Phased implementation (5.1 → 5.7)
- Mitigation: Modular component library
- Mitigation: Weekly deliverables

**Risk 2: Platform-Specific Issues**
- Mitigation: Test on both iOS/Android continuously
- Mitigation: Use Expo managed workflow
- Mitigation: Platform adapters for differences

**Risk 3: Performance with Large Datasets**
- Mitigation: Pagination from day 1
- Mitigation: FlatList optimization
- Mitigation: Lazy loading

---

## Recommendations

### Immediate Actions

1. ✅ **Approve Phase 5 plan**
2. ⏳ **Create new Azure AD mobile app registration**
3. ⏳ **Set up Expo account for builds**
4. ⏳ **Allocate development resources (1-2 developers)**
5. ⏳ **Begin Phase 5.1 Foundation setup**

### Migration Approach

**DO:**
- ✅ Copy LoginScreen and AuthContext from old project
- ✅ Copy CROAdminDashboard and enhance it
- ✅ Copy navigation structure and extend it
- ✅ Learn from architectural patterns
- ✅ Reuse design token usage pattern

**DON'T:**
- ❌ Copy package.json dependencies (outdated)
- ❌ Try to use old @protocolsync/core link
- ❌ Skip monorepo shared packages
- ❌ Build features in isolation (use shared packages)

### Success Criteria

**Technical:**
- ✅ All 5 shared packages integrated
- ✅ 40+ screens built and functional
- ✅ 100% feature parity with web
- ✅ <50MB app bundle size
- ✅ <3s app startup time

**Business:**
- ✅ All 4 role dashboards working
- ✅ Complete CRUD operations
- ✅ File upload/download working
- ✅ Reports generation functional
- ✅ Billing fully integrated

---

## Conclusion

The old `protocolsync-mobile` project provided valuable proof-of-concept for:
- Azure AD authentication on React Native
- Basic dashboard layout
- Design tokens integration
- Navigation patterns

However, it only achieved **~5% of total portal features** and was correctly abandoned due to code duplication issues.

**With the monorepo now complete (Phase 0-4), we have:**
- ✅ 5 shared packages ready
- ✅ Proven business logic
- ✅ Consistent types and constants
- ✅ Design tokens for both platforms
- ✅ Clear migration path

**Phase 5 is ready to begin with high confidence of success.** The foundation is solid, the architecture is proven, and the path forward is clear.

---

**Next Steps**: Begin Phase 5.1 - Foundation Setup (Week 1-2) 🚀

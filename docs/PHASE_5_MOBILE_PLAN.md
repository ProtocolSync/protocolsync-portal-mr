# Phase 5: React Native Mobile Portal - Implementation Plan

**Date**: January 8, 2026
**Status**: 🚀 Ready to Begin
**Objective**: Port the complete ProtocolSync web portal to React Native with 100% feature parity

---

## Executive Summary

Phase 5 converts the React Admin/CoreUI web portal into a React Native mobile application while maintaining:
- ✅ 100% feature parity with web portal
- ✅ Identical business logic (using shared packages)
- ✅ Consistent UI/UX patterns
- ✅ All 4 role-based dashboards
- ✅ Complete trial, site, user, protocol, and billing management

### Previous Mobile Project Analysis

The abandoned `protocolsync-mobile` project completed:
- ✅ Basic Expo setup with React Native
- ✅ Login screen with Azure AD authentication
- ✅ Basic CRO Admin Dashboard
- ✅ Design tokens integration
- ✅ AuthContext implementation
- ❌ Incomplete: Only 2 screens (Login, HomeScreen with basic dashboard)
- ❌ Missing: 95% of portal features

**Why abandoned**: Tried to build as separate project without monorepo shared packages, leading to code duplication complexity.

**Why it will succeed now**: Monorepo with 5 shared packages eliminates duplication and ensures consistent business logic.

---

## Architecture Overview

```
protocolsync-monorepo/
├── apps/
│   ├── portal-web/          ← Existing React web app (Phase 0-4 ✅)
│   └── portal-mobile/        ← NEW React Native app (Phase 5)
│
├── packages/
│   ├── shared-types/         ← Shared TypeScript types ✅
│   ├── shared-constants/     ← API config, roles ✅
│   ├── shared-utils/         ← Validation, formatters ✅
│   ├── shared-services/      ← ApiClient, auth ✅
│   ├── shared-hooks/         ← React hooks ✅
│   └── shared-styles/        ← Design tokens (web + mobile) ✅
```

### Technology Stack

**Mobile App Stack:**
- **Framework**: React Native 0.81.5
- **Platform**: Expo ~54.0.30
- **Language**: TypeScript 5.9.2
- **UI Library**: React Native Paper 5.12.5
- **Navigation**: React Navigation 6.x (drawer + stack)
- **Authentication**: react-native-msal 4.0.4 (Azure AD)
- **Storage**: @react-native-async-storage/async-storage
- **File Handling**: expo-document-picker, expo-file-system
- **State Management**: React Context API (shared)

**Shared Dependencies:**
- All 5 shared packages from monorepo
- Design tokens from @protocolsync/shared-styles

---

## Feature Parity Checklist

### 1. Authentication & User Management ✅ Started

**Web Features:**
- Azure AD MSAL authentication
- Multi-tenant architecture (company/site)
- Role-based access control (4 roles)
- User context with profile data
- Role switching capability
- Session management & auto-logout

**Mobile Port Status:**
- ✅ Azure AD integration (react-native-msal)
- ✅ Login screen
- ✅ AuthContext
- ⏳ User profile display
- ⏳ Role switching UI
- ⏳ Session management

**Components to Create:**
- [x] `LoginScreen.tsx` (exists, needs update)
- [ ] `UserProfileScreen.tsx`
- [ ] `RoleSwitcherModal.tsx`
- [ ] `SessionTimeoutModal.tsx`

---

### 2. Dashboard Views (4 Role-Based)

#### 2.1 CRO Admin Dashboard ⏳ Partially Done

**Web Features:**
- Overview statistics cards (Total Sites, Site Admins, Users, Billing)
- Quick action cards (Manage Sites, Admins, Users, Billing)
- Real-time API data fetching

**Mobile Port Status:**
- ✅ Basic stats display (abandoned project)
- ⏳ Quick action cards
- ⏳ Clickable stats navigation
- ⏳ Refresh control

**Components to Create:**
- [x] `CROAdminDashboard.tsx` (exists, needs enhancement)
- [ ] `StatsCard.tsx`
- [ ] `QuickActionCard.tsx`

#### 2.2 Site Admin Dashboard ❌ Not Started

**Web Features:**
- Active trials overview (count + table/cards)
- Trial cards with badges (phase, status)
- Quick actions (Create Trial, Manage Users)
- Site summary stats

**Mobile Port Status:**
- ❌ Not started

**Components to Create:**
- [ ] `SiteAdminDashboard.tsx`
- [ ] `TrialCard.tsx` (mobile optimized)
- [ ] `PhaseStatusBadge.tsx`
- [ ] `TrialStatsCard.tsx`

#### 2.3 Trial Lead Dashboard ❌ Not Started

**Web Features:**
- My assigned trials overview
- Trial cards with role badges
- Quick actions (Protocol Versions, Delegation Log)
- Trial count display

**Mobile Port Status:**
- ❌ Not started

**Components to Create:**
- [ ] `TrialLeadDashboard.tsx`
- [ ] `AssignedTrialCard.tsx`
- [ ] `RoleBadge.tsx`

#### 2.4 Site User Dashboard ❌ Not Started

**Web Features:**
- My delegated protocols list
- Protocol cards with version badges
- Status badges (accepted/pending/declined)
- Accept/decline delegation actions

**Mobile Port Status:**
- ❌ Not started

**Components to Create:**
- [ ] `SiteUserDashboard.tsx`
- [ ] `DelegatedProtocolCard.tsx`
- [ ] `VersionBadge.tsx` (reusable)
- [ ] `DelegationActionButtons.tsx`

---

### 3. Trial Management ❌ Not Started

**Web Features:**
- Trials list (paginated, sortable)
- Mobile: Card-based layout
- Desktop: Table layout
- Trial detail modal
- Add trial modal
- Change trial status (active ↔ paused)
- Assign trial lead

**Mobile Port Status:**
- ❌ Not started

**Components to Create:**
- [ ] `TrialsListScreen.tsx`
- [ ] `TrialDetailScreen.tsx`
- [ ] `AddTrialScreen.tsx` (full screen instead of modal)
- [ ] `TrialStatusSheet.tsx` (bottom sheet)
- [ ] `TrialCard.tsx` (list item)

---

### 4. Site Management (CRO Admin) ❌ Not Started

**Web Features:**
- Sites list with status
- Site detail modal
- Add site modal
- Enable/disable site
- Site info display (location, trials, users)

**Mobile Port Status:**
- ❌ Not started

**Components to Create:**
- [ ] `SitesListScreen.tsx`
- [ ] `SiteDetailScreen.tsx`
- [ ] `AddSiteScreen.tsx`
- [ ] `SiteStatusSheet.tsx`
- [ ] `SiteCard.tsx`

---

### 5. User Management ❌ Not Started

#### 5.1 Users (CRO Admin)

**Web Features:**
- All users list (all companies/sites)
- User detail modal
- Resend invitation
- Toggle user status (activate/deactivate)
- Filter/search

**Components to Create:**
- [ ] `UsersListScreen.tsx`
- [ ] `UserDetailScreen.tsx`
- [ ] `UserCard.tsx`
- [ ] `UserActionsSheet.tsx`

#### 5.2 Site Users (Site Admin)

**Web Features:**
- Site-specific users list
- User detail modal
- Assign user to trial modal
- Remove user from site
- Resend invitation

**Components to Create:**
- [ ] `SiteUsersListScreen.tsx`
- [ ] `SiteUserDetailScreen.tsx`
- [ ] `AssignUserToTrialScreen.tsx`
- [ ] `SiteUserCard.tsx`

#### 5.3 Site Administrators (CRO Admin)

**Web Features:**
- Site administrators list
- Admin detail modal
- Add/edit administrator
- Delete administrator

**Components to Create:**
- [ ] `SiteAdministratorsListScreen.tsx`
- [ ] `AdminDetailScreen.tsx`
- [ ] `AddEditAdminScreen.tsx`
- [ ] `AdminCard.tsx`

---

### 6. Protocol Management ❌ Not Started

#### 6.1 Protocol Version Management (Trial Leads)

**Web Features:**
- Protocol documents list
- Version tracking
- Upload new protocol version
- Protocol detail with version history
- Download protocol files

**Components to Create:**
- [ ] `ProtocolVersionsListScreen.tsx`
- [ ] `ProtocolDetailScreen.tsx`
- [ ] `ProtocolUploadScreen.tsx`
- [ ] `ProtocolCard.tsx`
- [ ] `VersionHistoryList.tsx`

#### 6.2 My Protocols (Site Users)

**Web Features:**
- Delegated protocols list (read-only)
- Accept/decline protocol delegation
- Protocol query/Q&A (ChatWidget)
- Version badges
- Status badges

**Components to Create:**
- [ ] `MyProtocolsListScreen.tsx`
- [ ] `ProtocolViewScreen.tsx`
- [ ] `DelegationAcceptanceSheet.tsx`
- [ ] `ProtocolChatScreen.tsx`

---

### 7. Delegation & Compliance ❌ Not Started

#### 7.1 Delegation Log (Trial Leads)

**Web Features:**
- Comprehensive audit trail
- Delegation status (active, pending, revoked)
- Revoke delegation action
- Filter by protocol, role, status
- Date range filtering

**Components to Create:**
- [ ] `DelegationLogScreen.tsx`
- [ ] `DelegationLogCard.tsx`
- [ ] `DelegationFilterSheet.tsx`
- [ ] `RevokeDelegationSheet.tsx`

---

### 8. Reports Generation ❌ Not Started

**Web Features:**
- 5 Report Types:
  1. Delegation Log Report
  2. System Access Report
  3. Site/Trial Master Report
  4. Permission Change Log
  5. Deactivation Report
- Report configuration (filters, date range)
- PDF/CSV download
- Format selection (PDF-signed, PDF, CSV)

**Components to Create:**
- [ ] `ReportsScreen.tsx`
- [ ] `ReportCard.tsx` (5 types)
- [ ] `ReportConfigScreen.tsx`
- [ ] `ReportPreviewScreen.tsx`
- [ ] `ReportDownloadSheet.tsx`

---

### 9. Billing & Subscription Management ❌ Not Started

**Web Features:**
- Subscription overview (plan, price, features)
- Plan comparison & upgrade/downgrade
- Payment methods management (add, edit, delete)
- Invoice history with download
- Stripe integration
- Cancel subscription

**Components to Create:**
- [ ] `BillingScreen.tsx` (tabs: Subscription, Payment, Invoices)
- [ ] `SubscriptionTab.tsx`
- [ ] `PlanCard.tsx`
- [ ] `PaymentMethodsTab.tsx`
- [ ] `PaymentMethodCard.tsx`
- [ ] `AddPaymentMethodScreen.tsx`
- [ ] `InvoicesTab.tsx`
- [ ] `InvoiceCard.tsx`

---

### 10. Help & Support ❌ Not Started

**Web Features:**
- Floating help button (always visible)
- AI-powered help chat widget
- Message history
- Source citations
- Escalation modal

**Components to Create:**
- [ ] `HelpChatScreen.tsx`
- [ ] `FloatingHelpButton.tsx`
- [ ] `ChatMessage.tsx`
- [ ] `HelpEscalationSheet.tsx`

---

## Navigation Structure

### Stack Navigator Hierarchy

```typescript
RootNavigator (Stack)
├─ AuthStack
│  └─ Login
│
└─ AppDrawer (Drawer Navigator)
   ├─ Dashboard (role-based)
   │
   ├─ CRO Admin Routes
   │  ├─ SitesStack
   │  │  ├─ SitesList
   │  │  ├─ SiteDetail
   │  │  └─ AddSite
   │  ├─ AdminsStack
   │  │  ├─ AdminsList
   │  │  ├─ AdminDetail
   │  │  └─ AddEditAdmin
   │  ├─ UsersStack
   │  │  ├─ UsersList
   │  │  └─ UserDetail
   │  └─ BillingStack
   │     ├─ Billing (tabs)
   │     └─ AddPaymentMethod
   │
   ├─ Site Admin Routes
   │  ├─ TrialsStack
   │  │  ├─ TrialsList
   │  │  ├─ TrialDetail
   │  │  └─ AddTrial
   │  └─ SiteUsersStack
   │     ├─ SiteUsersList
   │     ├─ SiteUserDetail
   │     └─ AssignUserToTrial
   │
   ├─ Trial Lead Routes
   │  ├─ ProtocolsStack
   │  │  ├─ ProtocolsList
   │  │  ├─ ProtocolDetail
   │  │  └─ ProtocolUpload
   │  └─ DelegationLogStack
   │     ├─ DelegationLog
   │     └─ DelegationDetail
   │
   ├─ Site User Routes
   │  └─ MyProtocolsStack
   │     ├─ MyProtocolsList
   │     ├─ ProtocolView
   │     └─ ProtocolChat
   │
   ├─ Shared Routes
   │  ├─ ReportsStack
   │  │  ├─ Reports
   │  │  ├─ ReportConfig
   │  │  └─ ReportPreview
   │  ├─ HelpStack
   │  │  └─ HelpChat
   │  └─ ProfileStack
   │     ├─ UserProfile
   │     └─ Settings
```

---

## UI Component Library (React Native)

### Core Components (To Build)

**Layout:**
- `Screen.tsx` - Screen wrapper with safe area
- `Container.tsx` - Content container
- `Card.tsx` - Card component
- `Section.tsx` - Section with header

**Navigation:**
- `AppDrawer.tsx` - Custom drawer navigation
- `TabBar.tsx` - Bottom tab bar (alternative)
- `HeaderBar.tsx` - Screen header with actions

**Form Elements:**
- `Input.tsx` - Text input
- `Select.tsx` - Picker/select
- `Checkbox.tsx` - Checkbox
- `Switch.tsx` - Toggle switch
- `DatePicker.tsx` - Date picker modal
- `FilePicker.tsx` - File upload picker

**Data Display:**
- `Badge.tsx` - Status/version badge
- `Chip.tsx` - Tag/chip
- `Avatar.tsx` - User avatar
- `EmptyState.tsx` - Empty list state
- `ErrorState.tsx` - Error display

**Feedback:**
- `Toast.tsx` - Toast notification
- `Alert.tsx` - Alert dialog
- `BottomSheet.tsx` - Bottom sheet modal
- `LoadingSpinner.tsx` - Loading indicator
- `ProgressBar.tsx` - Progress bar

**Lists:**
- `List.tsx` - List container
- `ListItem.tsx` - List item
- `Separator.tsx` - List separator
- `RefreshControl.tsx` - Pull-to-refresh

**Buttons:**
- `Button.tsx` - Primary button
- `IconButton.tsx` - Icon button
- `FAB.tsx` - Floating action button
- `ButtonGroup.tsx` - Button group

**Complex Components:**
- `SearchBar.tsx` - Search input
- `FilterSheet.tsx` - Filter bottom sheet
- `SortSheet.tsx` - Sort bottom sheet
- `DateRangeSheet.tsx` - Date range picker

---

## Data Flow & State Management

### Shared State (Using Monorepo Packages)

**From @protocolsync/shared-hooks:**
- `useLogin()` - Login state management ✅
- `useDashboard()` - Dashboard data (to add)
- `useTrials()` - Trials data (to add)
- `useProtocols()` - Protocols data (to add)

**From @protocolsync/shared-services:**
- `ApiClient` - HTTP client with auth ✅
- `IAuthService` - Auth interface ✅

**From @protocolsync/shared-types:**
- `User`, `Role`, `Company`, `Site` ✅
- `Trial`, `Protocol`, `Delegation` ✅
- All TypeScript interfaces ✅

### Mobile-Specific State

**React Context:**
- `UserContext` - User profile (reuse from shared or create mobile version)
- `RoleContext` - Active role
- `NavigationContext` - Navigation state
- `ThemeContext` - Theme/appearance (light/dark)

**Local Storage:**
- AsyncStorage for:
  - Auth tokens
  - User preferences
  - Cached data
  - Offline queue

---

## Platform Adapters (Mobile-Specific)

### Storage Adapter

```typescript
// Mobile implementation
class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
```

### Environment Adapter

```typescript
// Mobile implementation
class MobileEnvironmentAdapter implements EnvironmentAdapter {
  get(key: string): string | undefined {
    // Expo uses EXPO_PUBLIC_ prefix
    return process.env[`EXPO_PUBLIC_${key}`];
  }

  getRequired(key: string): string {
    const value = this.get(key);
    if (!value) throw new Error(`Missing env: ${key}`);
    return value;
  }
}
```

### File System Adapter

```typescript
// Mobile file handling
class MobileFileAdapter {
  async pickDocument() {
    return DocumentPicker.getDocumentAsync();
  }

  async downloadFile(url: string, filename: string) {
    return FileSystem.downloadAsync(url,
      FileSystem.documentDirectory + filename
    );
  }
}
```

---

## Authentication Flow (Mobile)

### Azure AD MSAL Flow

```typescript
// Using react-native-msal
import { MSALWebView } from 'react-native-msal';

1. User clicks "Sign in with Microsoft"
2. Open Azure AD web view (MSALWebView)
3. User authenticates
4. Receive access token + refresh token
5. Store tokens in AsyncStorage
6. Fetch user profile from API
7. Navigate to role-based dashboard
8. Attach token to API requests (Authorization: Bearer)
```

### Session Management

- Token expiration detection
- Auto-refresh on app resume
- Logout on 401/403 errors
- Timeout modal before auto-logout

---

## Offline Support Strategy

### Data Caching

**What to Cache:**
- User profile
- Dashboard statistics (with timestamp)
- Recent trials/sites/protocols
- Delegation logs

**Cache Strategy:**
- AsyncStorage for JSON data
- FileSystem for downloaded PDFs
- Timestamp-based invalidation
- Pull-to-refresh to update

### Offline Queue

**Queued Actions:**
- Protocol delegation acceptance
- Trial status changes
- User profile updates

**Sync Strategy:**
- Retry on network restore
- Background sync on app resume
- Show pending status badge

---

## File Handling

### Upload (Protocol PDFs)

```typescript
1. expo-document-picker to select file
2. Read file as base64 or blob
3. Upload via API (multipart/form-data)
4. Show upload progress
5. Success notification
```

### Download (Reports, Protocols)

```typescript
1. Fetch file URL from API
2. expo-file-system downloadAsync
3. Save to device storage
4. Open with device PDF viewer
5. Option to share
```

---

## Push Notifications (Future Enhancement)

**Notification Types:**
- New protocol delegation
- Trial status change
- User invitation
- Report ready for download
- Billing reminder

**Implementation:**
- Expo Notifications
- Backend: Send via Firebase/APNs
- Deep linking to relevant screen

---

## Testing Strategy

### Unit Tests

**What to Test:**
- Shared hooks logic
- API client methods
- Utility functions
- Component rendering

**Tools:**
- Jest
- React Native Testing Library

### Integration Tests

**What to Test:**
- Authentication flow
- Navigation between screens
- API data fetching
- Form submissions

### E2E Tests

**What to Test:**
- Login → Dashboard → Feature workflows
- Complete user journeys per role

**Tools:**
- Detox (preferred for React Native)
- Appium (alternative)

---

## Performance Optimization

### React Native Best Practices

1. **List Rendering:**
   - Use `FlatList` with `keyExtractor`
   - Implement `getItemLayout` for fixed heights
   - Use `windowSize` and `maxToRenderPerBatch`

2. **Image Optimization:**
   - Use `FastImage` for caching
   - Optimize image sizes
   - Lazy load images

3. **Navigation:**
   - Use `React.memo` for screens
   - Optimize navigator options
   - Avoid inline functions in renderItem

4. **Bundle Size:**
   - Code splitting per route
   - Lazy load heavy modules
   - Tree-shaking unused code

---

## Build & Deployment

### Development

```bash
cd apps/portal-mobile
npm start                  # Start Expo dev server
npm run ios               # Run on iOS simulator
npm run android           # Run on Android emulator
```

### Production Builds

**Using EAS (Expo Application Services):**

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

**Submission:**

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

### Environment Configuration

**Development:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_API_KEY=dev-key
EXPO_PUBLIC_AZURE_CLIENT_ID=xxx
EXPO_PUBLIC_AZURE_TENANT_ID=xxx
```

**Production:**
```env
EXPO_PUBLIC_API_URL=https://api.protocolsync.com/api/v1
EXPO_PUBLIC_API_KEY=prod-key
EXPO_PUBLIC_AZURE_CLIENT_ID=xxx
EXPO_PUBLIC_AZURE_TENANT_ID=xxx
```

---

## Migration from Old Mobile Project

### What to Reuse from protocolsync-mobile

**Keep:**
- ✅ Login screen design (update with latest tokens)
- ✅ AuthContext structure
- ✅ Basic CRO Admin Dashboard layout
- ✅ Design tokens integration pattern
- ✅ Navigation structure (AppNavigator)

**Update:**
- ⏳ Replace local @protocolsync/core with monorepo packages
- ⏳ Update dependencies to latest versions
- ⏳ Migrate to new shared-services ApiClient
- ⏳ Replace design-tokens.json with @protocolsync/shared-styles

**Discard:**
- ❌ core-shim.tsx (no longer needed with monorepo)
- ❌ Local duplicated code
- ❌ Outdated ARCHITECTURE.md (superseded by monorepo)

---

## Implementation Phases

### Phase 5.1: Foundation (Week 1-2)

**Goals:**
- Set up React Native app in monorepo
- Configure Expo with TypeScript
- Link all 5 shared packages
- Port authentication flow
- Create navigation structure
- Build core UI component library

**Deliverables:**
- `apps/portal-mobile/` directory
- Working login flow
- Navigation framework
- 20+ reusable UI components

### Phase 5.2: Dashboards (Week 3-4)

**Goals:**
- Port all 4 role-based dashboards
- Implement dashboard data fetching
- Create dashboard cards/stats
- Add role switching UI

**Deliverables:**
- CRO Admin Dashboard (complete)
- Site Admin Dashboard (complete)
- Trial Lead Dashboard (complete)
- Site User Dashboard (complete)

### Phase 5.3: Trial & Site Management (Week 5-6)

**Goals:**
- Port trials list and detail screens
- Port sites list and detail screens
- Implement CRUD operations
- Add trial/site status changes

**Deliverables:**
- Trials management (complete)
- Sites management (complete)
- Add trial/site screens
- Status change modals

### Phase 5.4: User Management (Week 7-8)

**Goals:**
- Port users list and detail
- Port site users management
- Port site administrators
- Implement user invitation flow

**Deliverables:**
- Users management (complete)
- Site users management (complete)
- Site admins management (complete)
- User invitation emails

### Phase 5.5: Protocols & Delegation (Week 9-10)

**Goals:**
- Port protocol version management
- Port my protocols (site users)
- Implement delegation log
- Add file upload/download

**Deliverables:**
- Protocol management (complete)
- Delegation system (complete)
- File handling (upload/download)
- Delegation acceptance UI

### Phase 5.6: Reports & Billing (Week 11-12)

**Goals:**
- Port reports generation
- Port billing/subscription management
- Implement payment methods
- Add invoice history

**Deliverables:**
- 5 report types (complete)
- Billing screens (complete)
- Stripe integration
- Invoice downloads

### Phase 5.7: Polish & Testing (Week 13-14)

**Goals:**
- Implement help chat widget
- Add offline support
- Performance optimization
- Comprehensive testing
- Bug fixes and polish

**Deliverables:**
- Help chat (complete)
- Offline caching
- Performance benchmarks
- Test coverage >80%
- Production-ready app

---

## Success Metrics

### Technical Metrics

- ✅ 100% feature parity with web portal
- ✅ All 4 dashboards functional
- ✅ All CRUD operations working
- ✅ File upload/download working
- ✅ Offline support implemented
- ✅ <3s app startup time
- ✅ 60fps UI performance
- ✅ <50MB app bundle size
- ✅ Test coverage >80%

### Business Metrics

- ✅ All user roles supported
- ✅ Complete trial management
- ✅ Complete protocol management
- ✅ Full delegation tracking
- ✅ Reports generation working
- ✅ Billing fully functional
- ✅ Zero feature regressions
- ✅ Identical business logic

---

## Risk Assessment

### Low Risk ✅

- Shared packages already tested and working
- Authentication pattern proven in old mobile project
- React Native ecosystem mature
- Expo simplifies deployment

### Medium Risk ⚠️

- File upload/download on mobile (mitigated: Expo libraries)
- PDF generation on mobile (mitigated: backend API)
- Offline sync complexity (mitigated: simple caching first)
- Large codebase to port (mitigated: phased approach)

### High Risk 🔴

- Azure AD MSAL on React Native (mitigated: react-native-msal tested)
- App store approval process (mitigated: follow guidelines)
- Performance with large datasets (mitigated: pagination, virtualization)

---

## Dependencies & Prerequisites

### Prerequisites

- ✅ Monorepo with 5 shared packages (Phase 0-4 complete)
- ✅ Web portal working and tested
- ✅ API fully functional
- ✅ Azure AD app registration (web)
- ⏳ Azure AD app registration for mobile (redirect URI)
- ⏳ Expo account for EAS builds
- ⏳ Apple Developer account (iOS)
- ⏳ Google Play Developer account (Android)

### External Services

- Azure AD (authentication)
- Backend API (protocolsync-api)
- Stripe (billing/payments)
- Expo (builds/updates)
- App Store Connect (iOS)
- Google Play Console (Android)

---

## Team Handoff

### For Mobile Developers

1. Review monorepo structure in `/packages`
2. All business logic is in shared packages - reuse, don't duplicate
3. Use `@protocolsync/shared-*` imports
4. Follow React Native best practices
5. Test on both iOS and Android
6. Use Expo managed workflow

### For Backend Developers

1. Mobile uses same API endpoints as web
2. No backend changes needed initially
3. Future: Add push notification endpoints
4. Future: Add mobile-specific analytics

### For QA Team

1. Test all features on both platforms (iOS & Android)
2. Verify feature parity with web portal
3. Test offline mode and sync
4. Test file upload/download
5. Verify Azure AD authentication
6. Test all 4 role workflows

---

## Documentation & Resources

### Existing Documentation

- [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) - Monorepo setup (Phase 0-4)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Web deployment
- protocolsync-mobile/ARCHITECTURE.md - Old mobile architecture (reference only)

### To Create

- [ ] MOBILE_SETUP.md - Mobile app setup guide
- [ ] MOBILE_DEPLOYMENT.md - Mobile build/deploy guide
- [ ] COMPONENT_LIBRARY.md - React Native components
- [ ] TROUBLESHOOTING.md - Common mobile issues

### External Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)
- [react-native-msal Docs](https://github.com/stashenergy/react-native-msal)

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ Review Phase 5 plan with team
2. ⏳ Get approval to proceed
3. ⏳ Create Azure AD mobile app registration
4. ⏳ Set up Expo account
5. ⏳ Initialize mobile app in monorepo

### Week 1-2 Deliverables

- Set up `apps/portal-mobile/` with Expo
- Configure TypeScript + ESLint
- Link shared packages
- Port authentication flow
- Create navigation structure
- Build 20+ core UI components
- Test login on iOS + Android

---

## Sign-Off

**Plan Author**: Claude Code
**Date**: January 8, 2026
**Status**: 📋 Plan Complete - Awaiting Approval

**Estimated Timeline**: 14 weeks (3.5 months)
**Estimated Effort**: 1-2 full-time developers
**Complexity**: High (large codebase, but well-structured)
**Confidence**: High (monorepo foundation solid)

---

**Ready to Begin?** Let's start with Phase 5.1 - Foundation setup! 🚀

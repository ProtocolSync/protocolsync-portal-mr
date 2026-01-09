# Phase 5: Quick Reference Card

**One-page overview for Phase 5: React Native Mobile Portal**

---

## 📋 Status

- **Phase 0-4**: ✅ Complete (Monorepo with 5 shared packages)
- **Phase 5**: 🚀 Ready to Begin (Mobile app development)
- **Old Mobile Project**: ~5% complete (login + basic dashboard)
- **Target**: 100% feature parity with web portal

---

## 📚 Documentation

| Document | Purpose | Pages |
|----------|---------|-------|
| [PHASE_5_MOBILE_PLAN.md](./PHASE_5_MOBILE_PLAN.md) | Complete implementation plan | 43 |
| [MOBILE_MIGRATION_ASSESSMENT.md](./MOBILE_MIGRATION_ASSESSMENT.md) | Old vs new analysis | 29 |
| [PHASE_5_QUICK_START.md](./PHASE_5_QUICK_START.md) | Step-by-step setup | 16 |
| [PHASE_5_SUMMARY.md](./PHASE_5_SUMMARY.md) | Executive summary | 8 |
| [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) | Overall project status | 10 |

---

## 🎯 Scope

### Features to Port (20 major features)

1. ✅ Authentication (Azure AD) - Partially done
2. ⏳ 4 Role-Based Dashboards (admin, site_admin, trial_lead, site_user)
3. ⏳ Trial Management (CRUD, status changes)
4. ⏳ Site Management (CRO admin)
5. ⏳ User Management (3 types)
6. ⏳ Protocol Version Management
7. ⏳ My Protocols (site users)
8. ⏳ Delegation Log
9. ⏳ Reports (5 types)
10. ⏳ Billing & Subscriptions
11. ⏳ Payment Methods
12. ⏳ Invoices
13. ⏳ Help Chat Widget
14. ⏳ File Upload/Download

**Total**: 40+ screens, 50+ components, ~20,000 LOC

---

## 🏗️ Architecture

### Tech Stack

```
React Native 0.81.5
├── Expo ~54.0.30
├── TypeScript 5.9.2
├── React Navigation 6.x
├── React Native Paper 5.12.5
├── react-native-msal 4.0.4
└── Shared Packages:
    ├── @protocolsync/shared-types
    ├── @protocolsync/shared-constants
    ├── @protocolsync/shared-utils
    ├── @protocolsync/shared-services
    ├── @protocolsync/shared-hooks
    └── @protocolsync/shared-styles
```

### Monorepo Structure

```
protocolsync-monorepo/
├── apps/
│   ├── portal-web/          ✅ Complete
│   └── portal-mobile/        ⏳ Phase 5 (NEW)
└── packages/
    ├── shared-types/         ✅ Ready
    ├── shared-constants/     ✅ Ready
    ├── shared-utils/         ✅ Ready
    ├── shared-services/      ✅ Ready
    ├── shared-hooks/         ✅ Ready
    └── shared-styles/        ✅ Ready
```

---

## 📅 Timeline (14 Weeks)

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| 5.1 Foundation | 1-2 | App setup, auth, navigation, 20+ components |
| 5.2 Dashboards | 3-4 | 4 role-based dashboards |
| 5.3 Trial/Site | 5-6 | Trial & site management |
| 5.4 Users | 7-8 | User management (3 types) |
| 5.5 Protocols | 9-10 | Protocol management, delegation |
| 5.6 Reports/Billing | 11-12 | Reports, billing, payments |
| 5.7 Polish | 13-14 | Help chat, offline, testing |

---

## 🚀 Quick Start (Phase 5.1)

### Prerequisites

1. Azure AD mobile app registration
2. Expo account for builds
3. Dev environment (Node.js, Xcode, Android Studio)

### Setup Steps (12 steps)

```bash
# 1. Navigate to monorepo
cd ~/Documents/Projects/protocolsync-monorepo/apps

# 2. Create Expo app
npx create-expo-app portal-mobile --template expo-template-blank-typescript

# 3. Install dependencies (see PHASE_5_QUICK_START.md)

# 4. Link shared packages (npm install from root)

# 5. Copy from old mobile project:
cp ~/Documents/Projects/protocolsync-mobile/src/screens/LoginScreen.tsx apps/portal-mobile/src/screens/
cp ~/Documents/Projects/protocolsync-mobile/src/contexts/AuthContext.tsx apps/portal-mobile/src/contexts/

# 6. Update imports to use monorepo packages

# 7. Test
cd apps/portal-mobile
npm start
npm run ios
npm run android
```

**Full details**: See [PHASE_5_QUICK_START.md](./PHASE_5_QUICK_START.md)

---

## 📦 What's Reusable from Old Mobile Project

| Item | Status | Action |
|------|--------|--------|
| LoginScreen.tsx | ✅ 80% | Copy + update imports |
| AuthContext.tsx | ✅ 70% | Copy + integrate shared hooks |
| CROAdminDashboard.tsx | ⚠️ 30% | Copy + enhance |
| AppNavigator.tsx | ⚠️ 50% | Copy + extend with drawer |
| Design tokens pattern | ✅ 90% | Adapt to shared-styles |
| package.json | ❌ 0% | Rebuild with monorepo deps |

**Overall Reusability**: ~15% (saves ~1 week)

---

## ✅ Success Criteria

### Technical
- [ ] 100% feature parity with web
- [ ] All 4 dashboards functional
- [ ] All CRUD operations working
- [ ] File upload/download working
- [ ] <3s app startup
- [ ] 60fps UI performance
- [ ] <50MB app bundle
- [ ] >80% test coverage

### Business
- [ ] All user roles supported
- [ ] Complete trial management
- [ ] Complete protocol management
- [ ] Full delegation tracking
- [ ] Reports generation working
- [ ] Billing fully functional

---

## 🔧 Key Components to Build

### Foundation (Phase 5.1)
- [ ] Screen, Container, Card (layout)
- [ ] Input, Select, Switch (forms)
- [ ] Badge, Chip, Avatar (data)
- [ ] Toast, Alert, BottomSheet (feedback)
- [ ] AppDrawer, HeaderBar (navigation)

### Screens (40+ total)
- [ ] 4 Dashboards
- [ ] 6 Trial screens
- [ ] 4 Site screens
- [ ] 8 User screens
- [ ] 6 Protocol screens
- [ ] 5 Compliance screens
- [ ] 6 Billing screens
- [ ] 2 Support screens

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Code duplication | ✅ Monorepo shared packages |
| Business logic inconsistency | ✅ Shared hooks/services |
| Design inconsistency | ✅ Shared design tokens |
| Type safety issues | ✅ Shared types package |
| Large codebase complexity | ✅ Phased 14-week approach |
| Performance issues | ✅ Pagination, FlatList optimization |
| Platform differences | ✅ Platform adapters |

**Overall Risk**: Low ✅

---

## 📊 Effort Estimates

| Category | Screens | Components | LOC | Weeks |
|----------|---------|------------|-----|-------|
| Foundation | 2 | 20 | 2,000 | 2 |
| Dashboards | 4 | 15 | 3,000 | 2 |
| Trial/Site | 10 | 10 | 4,000 | 2 |
| Users | 8 | 8 | 3,000 | 2 |
| Protocols | 6 | 8 | 3,000 | 2 |
| Reports/Billing | 11 | 12 | 3,500 | 2 |
| Polish | - | 5 | 1,500 | 2 |
| **Total** | **41** | **78** | **20,000** | **14** |

---

## 🔗 External Dependencies

### Services
- Azure AD (authentication)
- Backend API (protocolsync-api)
- Stripe (billing/payments)
- Expo EAS (builds/updates)
- Apple App Store (iOS)
- Google Play Store (Android)

### Accounts Needed
- [ ] Azure AD app registration (mobile)
- [ ] Expo account
- [ ] Apple Developer ($99/year)
- [ ] Google Play Developer ($25 one-time)

---

## 📱 Build & Deploy

### Development
```bash
npm start          # Start Expo
npm run ios        # iOS simulator
npm run android    # Android emulator
```

### Production
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

---

## 📞 Next Actions

### Immediate (This Week)
1. [ ] Review planning documents
2. [ ] Approve Phase 5 start
3. [ ] Set up Azure AD mobile registration
4. [ ] Set up Expo account
5. [ ] Allocate developer resources

### Week 1-2 (Phase 5.1)
1. [ ] Follow [PHASE_5_QUICK_START.md](./PHASE_5_QUICK_START.md)
2. [ ] Initialize mobile app
3. [ ] Port authentication
4. [ ] Build UI components
5. [ ] Test on iOS + Android

---

## 📖 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [react-native-msal](https://github.com/stashenergy/react-native-msal)

---

## 💬 Support

**Questions?** Review the detailed planning documents:
1. Implementation details → [PHASE_5_MOBILE_PLAN.md](./PHASE_5_MOBILE_PLAN.md)
2. Migration strategy → [MOBILE_MIGRATION_ASSESSMENT.md](./MOBILE_MIGRATION_ASSESSMENT.md)
3. Setup instructions → [PHASE_5_QUICK_START.md](./PHASE_5_QUICK_START.md)

---

**Status**: 📋 Planning Complete | 🚀 Ready to Begin Phase 5.1

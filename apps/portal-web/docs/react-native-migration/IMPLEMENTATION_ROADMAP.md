# Implementation Roadmap - Fast Track
## Setup Unified Monorepo in 1-5 Days

**Target Timeline**: 1-5 days (6-8 hours per day)  
**Goal**: Create unified monorepo, extract shared packages, refactor web app to use them, ready for mobile.

**⚠️ Note**: This roadmap covers the **foundation setup only**. Mobile screens can be built incrementally after this foundation is solid.

---

## Overview: 4 Phases Over 1-5 Days

| Phase | Time | What You Do | Result |
|-------|------|-----------|--------|
| 1 | Day 1 (2-3 hrs) | Create monorepo structure | Root setup + web app moved |
| 2 | Day 1-2 (3-4 hrs) | Extract 5 shared packages | Reusable business logic |
| 3 | Day 2-3 (2-3 hrs) | Refactor web app | Web app using shared code |
| 4 | Day 3 (1 hr) | Verify & test | Monorepo foundation ready |
| 5+ | Optional | Build mobile screens | One screen at a time as needed |

---

## Phase 1: Create Monorepo Structure (Day 1, ~2-3 hours)

### 1.1 Setup Monorepo Structure

#### Step 1: Create Root Directory Structure
```bash
cd /Users/davidtay/Documents/Projects

# Create new monorepo root
mkdir protocolsync-monorepo
cd protocolsync-monorepo

# Create app and package directories
mkdir -p apps packages
```

#### Step 2: Initialize Root `package.json`
```json
{
  "name": "@protocolsync/monorepo",
  "version": "1.0.0",
  "description": "ProtocolSync: Unified web and mobile portal",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev:web": "turbo run dev --filter=portal-web",
    "dev:mobile": "turbo run dev --filter=mobile",
    "build:web": "turbo run build --filter=portal-web",
    "build:mobile": "turbo run build --filter=mobile"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
```

#### Step 3: Create `turbo.json`
```json
{
  "version": "1",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": ["dist/**", "build/**", ".next/**"],
      "cache": false
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

#### Step 4: Copy Existing Web App
```bash
# Move existing portal-web into the monorepo
cp -r /Users/davidtay/Documents/Projects/protocolsync-portal \
      protocolsync-monorepo/apps/portal-web
```

### 1.2 Verify Web App Still Works
```bash
cd apps/portal-web
npm install
npm run dev
# Should run without errors on http://localhost:5173 (or similar)
```

---

## Phase 2: Extract Shared Packages (Day 1-2, ~3-4 hours)

**⚠️ Quick Path**: See [MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md) for copy-paste commands. This section explains what's happening.

### 2.1-2.5: Create 5 Shared Packages

Follow the detailed steps in [MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md) **Step 2** to quickly scaffold:

- **shared-types** - API response, User, Role, Dashboard types
- **shared-constants** - API endpoints, role labels
- **shared-utils** - Validation, formatters
- **shared-services** - ApiClient, auth interface
- **shared-hooks** - useLogin, useDashboard

Each package is ~50-100 lines of boilerplate. The doc provides ready-to-paste code.

**Checklist**:
- [ ] All 5 packages created in `packages/`
- [ ] Each runs `npm run build` successfully
- [ ] No TypeScript errors

---

## Phase 3: Refactor Web App (Day 2-3, ~2-3 hours)

**⚠️ Quick Path**: Follow [MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md) **Step 3** for copy-paste commands.

### 3.1 Update Web App package.json

Install shared packages as workspace dependencies.

### 3.2-3.4 Convert Components to .web.tsx

1. Rename `Login.tsx` → `Login.web.tsx`
2. Create `Login.tsx` export wrapper
3. Import `useLogin` from shared-hooks
4. Repeat for `CROAdminDashboard.tsx`

**Checklist**:
- [ ] Components renamed to `.web.tsx`
- [ ] Import from shared packages works
- [ ] No TypeScript errors

---

## Phase 4: Verify & Test (Day 3, ~1 hour)

### 4.1 Build & Run

```bash
npm run build          # Build all packages
npm run dev:web        # Start web dev server
```

### 4.2 Verify

- [ ] Web app builds without errors
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] No console errors
- [ ] TypeScript strict mode passes

---

## Foundation Complete! ✅

**Total time**: 1-5 days (~6-8 hours per day)

You now have:
- ✅ Unified monorepo structure
- ✅ 5 shared packages (types, constants, utils, services, hooks)
- ✅ Web app refactored to use shared code
- ✅ Ready for mobile development

---

## Next Phase (Optional): Build Mobile Screens

After foundation is solid, incrementally add mobile screens.

**For each new feature**:
1. Add logic to `packages/shared-hooks/`
2. Create `Component.web.tsx` (CoreUI)
3. Create `Component.native.tsx` (React Native)
4. Test both platforms

See [PLATFORM_CONDITIONAL_PATTERNS.md](./PLATFORM_CONDITIONAL_PATTERNS.md) for pattern examples.

---

## Still Want Detailed Timeline?

The original detailed phases (with weeks of timeline) are great for reference but **not necessary for foundation setup**.

If you want to add a full mobile app with all features matching the web app, budget ~4-6 weeks of development (not architecture setup), building screens incrementally.

---

## Reference Docs

- **[MONOREPO_SETUP_1_DAY.md](./MONOREPO_SETUP_1_DAY.md)** ← Start here for copy-paste commands
- [UNIFIED_MONOREPO_ARCHITECTURE.md](./UNIFIED_MONOREPO_ARCHITECTURE.md) - Architecture overview
- [SHARED_PACKAGES_ARCHITECTURE.md](./SHARED_PACKAGES_ARCHITECTURE.md) - Package structure details
- [PLATFORM_CONDITIONAL_PATTERNS.md](./PLATFORM_CONDITIONAL_PATTERNS.md) - Implementation patterns
- [AUTHENTICATION_ABSTRACTION.md](./AUTHENTICATION_ABSTRACTION.md) - Auth abstraction strategy


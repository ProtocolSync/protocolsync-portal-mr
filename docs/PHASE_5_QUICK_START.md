# Phase 5 Quick Start Guide

**Start Phase 5.1: Foundation Setup (Week 1-2)**

---

## Prerequisites Checklist

Before starting Phase 5.1, ensure you have:

- [x] ✅ Monorepo complete (Phase 0-4)
- [x] ✅ 5 shared packages built and tested
- [x] ✅ Web portal running successfully
- [ ] ⏳ Azure AD mobile app registration (needs setup)
- [ ] ⏳ Expo account (needs setup)
- [ ] ⏳ Node.js 20+ installed
- [ ] ⏳ Xcode (for iOS development)
- [ ] ⏳ Android Studio (for Android development)

---

## Step 1: Azure AD Mobile App Registration

### Create Mobile App Registration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. Navigate to "App registrations" → "New registration"
3. **Name**: `ProtocolSync Mobile`
4. **Supported account types**: Accounts in any organizational directory (Multitenant)
5. **Redirect URI**:
   - Platform: `Mobile and desktop applications`
   - URI: `msauth://com.protocolsync.mobile/auth`
6. Click **Register**

### Configure Mobile App

1. Copy **Application (client) ID** → save for later
2. Copy **Directory (tenant) ID** → save for later
3. Go to **Authentication**:
   - Enable "Allow public client flows": YES
   - Add platform: iOS/macOS
     - Bundle ID: `com.protocolsync.mobile`
   - Add platform: Android
     - Package name: `com.protocolsync.mobile`
     - Signature hash: (generate later with Expo)
4. Go to **API permissions**:
   - Add permission → Microsoft Graph
   - Delegated permissions:
     - `User.Read`
     - `openid`
     - `profile`
     - `email`
   - Grant admin consent
5. Go to **Expose an API**:
   - Add scope: `access_as_user`
   - Consent display name: "Access ProtocolSync as user"

### Save Configuration

```env
EXPO_PUBLIC_AZURE_CLIENT_ID=<Application-Client-ID>
EXPO_PUBLIC_AZURE_TENANT_ID=<Directory-Tenant-ID>
EXPO_PUBLIC_AZURE_REDIRECT_URI=msauth://com.protocolsync.mobile/auth
```

---

## Step 2: Set Up Expo Account

### Create Expo Account

1. Go to [expo.dev](https://expo.dev)
2. Sign up for free account
3. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
4. Login to EAS:
   ```bash
   eas login
   ```

### Create Expo Project

1. Create organization (optional): `protocolsync`
2. Prepare for project creation (will happen in Step 3)

---

## Step 3: Initialize Mobile App in Monorepo

### Navigate to Monorepo

```bash
cd ~/Documents/Projects/protocolsync-monorepo/apps
```

### Create React Native App with Expo

```bash
# Create new Expo app
npx create-expo-app portal-mobile --template expo-template-blank-typescript

# Navigate to app
cd portal-mobile
```

### Configure package.json

Edit `apps/portal-mobile/package.json`:

```json
{
  "name": "@protocolsync/portal-mobile",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android"
  },
  "dependencies": {
    "@protocolsync/shared-types": "*",
    "@protocolsync/shared-constants": "*",
    "@protocolsync/shared-utils": "*",
    "@protocolsync/shared-services": "*",
    "@protocolsync/shared-hooks": "*",
    "@protocolsync/shared-styles": "*",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/drawer": "^6.6.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "expo": "~54.0.30",
    "expo-document-picker": "~12.0.2",
    "expo-file-system": "~18.0.4",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-msal": "^4.0.4",
    "react-native-paper": "^5.12.5",
    "react-native-reanimated": "~3.16.4",
    "react-native-safe-area-context": "4.14.0",
    "react-native-screens": "~4.4.0",
    "react-native-web": "^0.21.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  }
}
```

### Install Dependencies

```bash
# Install all dependencies
npm install

# Go back to monorepo root
cd ../..

# Install/link monorepo dependencies
npm install
```

---

## Step 4: Configure Expo

### Create app.json

Edit `apps/portal-mobile/app.json`:

```json
{
  "expo": {
    "name": "ProtocolSync",
    "slug": "protocolsync-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.protocolsync.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.protocolsync.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-from-eas"
      }
    }
  }
}
```

### Create eas.json

Create `apps/portal-mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Create .env file

Create `apps/portal-mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_API_KEY=your-api-key
EXPO_PUBLIC_AZURE_CLIENT_ID=your-azure-client-id
EXPO_PUBLIC_AZURE_TENANT_ID=your-azure-tenant-id
EXPO_PUBLIC_AZURE_REDIRECT_URI=msauth://com.protocolsync.mobile/auth
```

---

## Step 5: Set Up Project Structure

### Create Directory Structure

```bash
cd apps/portal-mobile

# Create directories
mkdir -p src/{screens,components,navigation,contexts,adapters,utils,types}
mkdir -p src/components/{common,dashboards,trial,site,user,protocol,billing}
mkdir -p assets
```

### Directory Structure

```
apps/portal-mobile/
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Reusable components
│   │   ├── common/        # Generic UI components
│   │   ├── dashboards/    # Dashboard-specific
│   │   ├── trial/         # Trial management
│   │   ├── site/          # Site management
│   │   ├── user/          # User management
│   │   ├── protocol/      # Protocol management
│   │   └── billing/       # Billing components
│   ├── navigation/        # Navigation setup
│   ├── contexts/          # React contexts
│   ├── adapters/          # Platform adapters
│   ├── utils/             # Utility functions
│   └── types/             # Mobile-specific types
├── assets/                # Images, fonts, icons
├── App.tsx                # Root component
├── app.json               # Expo config
├── eas.json               # EAS build config
├── package.json
├── tsconfig.json
└── .env                   # Environment variables
```

---

## Step 6: Copy Code from Old Mobile Project

### Files to Copy

```bash
# Copy login screen
cp ~/Documents/Projects/protocolsync-mobile/src/screens/LoginScreen.tsx \
   apps/portal-mobile/src/screens/

# Copy auth context
cp ~/Documents/Projects/protocolsync-mobile/src/contexts/AuthContext.tsx \
   apps/portal-mobile/src/contexts/

# Copy CRO admin dashboard
cp ~/Documents/Projects/protocolsync-mobile/src/components/dashboards/CROAdminDashboard.tsx \
   apps/portal-mobile/src/components/dashboards/

# Copy navigation
cp ~/Documents/Projects/protocolsync-mobile/src/navigation/AppNavigator.tsx \
   apps/portal-mobile/src/navigation/

# Copy assets
cp -r ~/Documents/Projects/protocolsync-mobile/assets/* \
   apps/portal-mobile/assets/
```

### Update Imports in Copied Files

**In all copied files**, replace:

```typescript
// OLD (from protocolsync-mobile)
import designTokens from '../design-tokens.json';
import { useAuth } from '../contexts/AuthContext';

// NEW (monorepo)
import { designTokens } from '@protocolsync/shared-styles/mobile';
import { User, Role } from '@protocolsync/shared-types';
import { API_ENDPOINTS } from '@protocolsync/shared-constants';
import { ApiClient } from '@protocolsync/shared-services';
import { useLogin } from '@protocolsync/shared-hooks';
```

---

## Step 7: Create Platform Adapters

### Create Storage Adapter

Create `apps/portal-mobile/src/adapters/storage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const storage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
```

### Create Environment Adapter

Create `apps/portal-mobile/src/adapters/environment.ts`:

```typescript
export interface EnvironmentAdapter {
  get(key: string): string | undefined;
  getRequired(key: string): string;
}

export const env: EnvironmentAdapter = {
  get(key: string): string | undefined {
    // Expo uses EXPO_PUBLIC_ prefix
    return process.env[`EXPO_PUBLIC_${key}`];
  },

  getRequired(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  },
};
```

---

## Step 8: Create Root App Component

### Update App.tsx

Edit `apps/portal-mobile/App.tsx`:

```typescript
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
```

---

## Step 9: Test Initial Setup

### Start Development Server

```bash
cd apps/portal-mobile

# Start Expo dev server
npm start
```

### Test on iOS Simulator

```bash
npm run ios
```

### Test on Android Emulator

```bash
npm run android
```

### Verify

- [ ] App launches without errors
- [ ] Login screen displays
- [ ] Azure AD authentication works
- [ ] Navigation works
- [ ] Shared packages import successfully

---

## Step 10: Update Monorepo Root

### Add Mobile App to Turbo

Edit `turbo.json` in monorepo root:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "build:web": {
      "dependsOn": ["^build"],
      "outputs": ["apps/portal-web/dist/**"]
    },
    "build:mobile": {
      "dependsOn": ["^build"],
      "outputs": ["apps/portal-mobile/dist/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Add Mobile Scripts to Root

Edit `package.json` in monorepo root:

```json
{
  "scripts": {
    "build": "turbo run build",
    "build:web": "turbo run build --filter=@protocolsync/portal-web",
    "build:mobile": "turbo run build --filter=@protocolsync/portal-mobile",
    "dev:web": "cd apps/portal-web && npm run dev",
    "dev:mobile": "cd apps/portal-mobile && npm start",
    "lint": "turbo run lint"
  }
}
```

---

## Step 11: Commit Initial Setup

### Git Commit

```bash
cd ~/Documents/Projects/protocolsync-monorepo

git add .
git commit -m "feat: Phase 5.1 - Initialize React Native mobile app

- Add apps/portal-mobile with Expo + TypeScript
- Link all 5 shared packages from monorepo
- Configure Azure AD mobile authentication
- Copy and update login screen from old project
- Create platform adapters (storage, environment)
- Set up navigation structure
- Configure EAS for builds
- Add mobile scripts to root package.json

Phase 5.1 foundation complete. Ready for UI components.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Step 12: Next Steps (Week 2)

### Build Core UI Component Library

Create these components in `src/components/common/`:

**Layout:**
- [ ] `Screen.tsx`
- [ ] `Container.tsx`
- [ ] `Card.tsx`
- [ ] `Section.tsx`

**Form Elements:**
- [ ] `Input.tsx`
- [ ] `Select.tsx`
- [ ] `Checkbox.tsx`
- [ ] `Switch.tsx`

**Data Display:**
- [ ] `Badge.tsx`
- [ ] `Chip.tsx`
- [ ] `Avatar.tsx`
- [ ] `EmptyState.tsx`

**Feedback:**
- [ ] `Toast.tsx`
- [ ] `Alert.tsx`
- [ ] `BottomSheet.tsx`
- [ ] `LoadingSpinner.tsx`

**Navigation:**
- [ ] `AppDrawer.tsx`
- [ ] `HeaderBar.tsx`

---

## Troubleshooting

### Common Issues

**Issue: Expo won't start**
```bash
# Clear cache
npx expo start --clear
```

**Issue: Shared packages not found**
```bash
# Reinstall from monorepo root
cd ~/Documents/Projects/protocolsync-monorepo
npm install
```

**Issue: Metro bundler errors**
```bash
# Reset Metro bundler
npx expo start --reset-cache
```

**Issue: iOS simulator not launching**
```bash
# Open Xcode first
open -a Simulator
# Then run
npm run ios
```

**Issue: Android emulator not launching**
```bash
# List available emulators
emulator -list-avds
# Start emulator manually
emulator -avd <avd-name>
# Then run
npm run android
```

---

## Success Criteria for Phase 5.1

- [x] ✅ Mobile app created in monorepo
- [x] ✅ All 5 shared packages linked
- [x] ✅ Expo configured with TypeScript
- [x] ✅ Azure AD authentication working
- [x] ✅ Login screen functional
- [x] ✅ Navigation framework set up
- [x] ✅ Platform adapters created
- [ ] ⏳ Core UI component library (Week 2)
- [ ] ⏳ App runs on iOS simulator
- [ ] ⏳ App runs on Android emulator

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)
- [react-native-msal Docs](https://github.com/stashenergy/react-native-msal)
- [Monorepo MIGRATION_STATUS.md](./MIGRATION_STATUS.md)

---

**Ready to begin Phase 5.1!** 🚀

Follow these steps in order, and you'll have a solid foundation for the React Native mobile app by end of Week 2.

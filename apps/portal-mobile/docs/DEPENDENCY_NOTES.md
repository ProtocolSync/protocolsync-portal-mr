# Protocol Sync Mobile App

## Setup & Dependencies

### Critical Dependency Versions
This project uses **React Native Reanimated v4**, which requires **React Navigation v7**.
- `react-native-reanimated`: `~4.1.1` (Supports Reanimated 4)
- `@react-navigation/drawer`: `^7.x`
- `@react-navigation/stack`: `^7.x`
- `@react-navigation/native`: `^7.x`

**Do not downgrade** React Navigation to v6 without also downgrading Reanimated to v3, as Reanimated 4 removes legacy APIs that v6 relies on.

### Development
1. **Clean Install**:
   ```bash
   rm -rf node_modules apps/portal-mobile/node_modules
   npm install
   ```

2. **Run Android**:
   ```bash
   npm run android -w @protocolsync/portal-mobile
   # OR
   cd apps/portal-mobile && npx expo start --clear
   ```
   *Note: Ensure you have your Android Emulator (API 36) running.*

### Troubleshooting
- **"useLegacyImplementation prop is not available"**: This means you are using React Navigation v6 with Reanimated v4. Upgrade Navigation to v7.
- **"useAnimatedGestureHandler is not a function"**: Same as above. Reanimated 4 removed this hook.
- **"Couldn't register the navigator"**: You have mixed versions of React Navigation or duplicate node_modules. Run a clean install from the root.

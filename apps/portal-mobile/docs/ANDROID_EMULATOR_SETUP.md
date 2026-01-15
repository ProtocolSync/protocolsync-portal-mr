# Android Emulator Setup & Troubleshooting Guide

This guide documents the specific steps required to run the `portal-mobile` app on an Android Emulator, including version requirements and troubleshooting steps for common errors like `useLegacyImplementation`.

## Prerequisites

- **Node.js**: 18+ or 20+
- **Java/JDK**: JDK 17 (Required for React Native 0.73+)
- **Android Studio**: With SDK Platform 34/35/36 installed.
- **Emulator**: Created with API 34+ (Pixel 6/7 recommended).
- **Backend**: The `protocolsync-api` must be running locally on port 3000.

## Dependency Versions

Ensure your `package.json` matches these critical versions:

```json
{
  "dependencies": {
    "expo": "~54.0.31",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.1",
    "@react-navigation/drawer": "^6.6.6",
    "@react-navigation/native": "^6.1.9",
    "react-native-worklets-core": "^1.6.2",
    "expo-build-properties": "^1.0.10"
  }
}
```

## Configuration Checks

1.  **Proxy App.js**: Ensure a file named `App.js` exists in the **monorepo root** (`../../App.js`) with the following content:
    ```javascript
    import App from './apps/portal-mobile/App';
    export default App;
    ```
    *Reason: Fixes "Unable to resolve ../../App" error due to hoisted Expo packages.*

2.  **API URL (Android Loopback)**:
    In `apps/portal-mobile/.env` and `app.json`:
    - Use `http://10.0.2.2:3000/api/v1` instead of `localhost`.
    - Android Emulators allow local traffic via `10.0.2.2`.

3.  **AppNavigator.tsx**:
    Ensure `Drawer.Navigator` **does NOT** have the `useLegacyImplementation` prop.
    ```tsx
    // CORRECT
    <Drawer.Navigator screenOptions={{ ... }}>
    
    // INCORRECT
    <Drawer.Navigator useLegacyImplementation={false} ...>
    ```

## Clean Build Process (The "Nuclear" Option)

If you encounter persistent caching issues or the `useLegacyImplementation` error despite code fixes, follow this sequence exactly:

### 1. Clear Watchman and Metro Cache
```bash
# In the root or libs folder
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
```

### 2. Clean Android Build Artifacts
```bash
cd apps/portal-mobile
rm -rf android/.gradle
rm -rf android/app/build
cd android
./gradlew clean
cd ..
```
*Note: If the `android` folder is missing, run `npx expo prebuild` to regenerate it.*

### 3. Reinstall Dependencies (Optional but recommended if issues persist)
```bash
rm -rf node_modules
npm install
```

### 4. Run the Build
```bash
# Ensure we are in apps/portal-mobile
npx expo run:android
```

### 5. Start Metro with Reset Cache
If the app installs but fails to load the bundle:
```bash
npx expo start --clear
```
Then press `r` in the terminal to reload the app on the emulator.

## Common Errors & Solutions

### Error: `useLegacyImplementation` prop is not available...
- **Cause**: Old cached bundle code is running on the device, or the prop still exists in `AppNavigator.tsx`.
- **Fix**: Run the "Clean Build Process" above. Specifically, `npx expo start --clear` is crucial.

### Error: `Worklets Error: Mismatch between JavaScript part and native part...`
- **Cause**: Native binary includes a different version of Worklets C++ lib than the JS bundle is expecting.
- **Fix**:
    1. `npm install react-native-worklets-core`
    2. `cd android && ./gradlew clean`
    3. `npx expo run:android` (Must rebuild binary!)

### Error: `Network request failed`
- **Cause**: App trying to hit `localhost` (which isn't the host machine on Android) or Cleartext traffic blocked.
- **Fix**:
    1. Change URL to `10.0.2.2`.
    2. Check `expo-build-properties` allows cleartext traffic in `app.json`.

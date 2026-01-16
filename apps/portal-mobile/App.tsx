import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { RoleProvider } from './src/contexts/RoleContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { lightTheme } from '@protocolsync/shared-styles/mobile/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={lightTheme}>
        <AuthProvider>
          <RoleProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </RoleProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

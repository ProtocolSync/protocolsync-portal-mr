import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SitesScreen } from '../screens/SitesScreen';
import { SiteAdministratorsScreen } from '../screens/SiteAdministratorsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { BillingScreen } from '../screens/BillingScreen';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { AppHeader } from '../components/common/AppHeader';
import { AppSidebar } from '../components/common/AppSidebar';
import designTokens from '../design-tokens.json';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type DrawerParamList = {
  Home: undefined;
  Sites: undefined;
  Admins: undefined;
  Users: undefined;
  Trials: undefined;
  SiteUsers: undefined;
  Protocols: undefined;
  DelegationLog: undefined;
  MyProtocols: undefined;
  Reports: undefined;
  Billing: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props: DrawerContentComponentProps) => <AppSidebar {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 280,
        },
        headerShown: true,
        header: ({ navigation }) => (
          <AppHeader
            onMenuPress={() => navigation.toggleDrawer()}
          />
        ),
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerLabel: 'Dashboard',
        }}
      />
      <Drawer.Screen
        name="Sites"
        component={SitesScreen}
        options={{
          drawerLabel: 'Sites',
        }}
      />
      <Drawer.Screen
        name="Admins"
        component={SiteAdministratorsScreen}
        options={{
          drawerLabel: 'Site Administrators',
        }}
      />
      <Drawer.Screen
        name="Users"
        component={UsersScreen}
        options={{
          drawerLabel: 'Users',
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          drawerLabel: 'Reports',
        }}
      />
      <Drawer.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          drawerLabel: 'Billing',
        }}
      />
    </Drawer.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.color.background.page,
  },
  loadingText: {
    marginTop: designTokens.spacing.m,
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
});

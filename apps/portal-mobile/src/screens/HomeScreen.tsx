import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { CROAdminDashboard } from '../components/dashboards/CROAdminDashboard';
import { SiteAdminDashboard } from '../components/dashboards/SiteAdminDashboard';
import { TrialLeadDashboard } from '../components/dashboards/TrialLeadDashboard';
import { SiteUserDashboard } from '../components/dashboards/SiteUserDashboard';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/AppNavigator';
import designTokens from '../design-tokens.json';

type HomeScreenProps = DrawerScreenProps<DrawerParamList, 'Home'>;

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, loading } = useAuth();
  const { activeRole } = useRole();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  // Show dashboard based on active role
  const currentRole = activeRole || user.role;

  switch (currentRole) {
    case 'admin':
      return <CROAdminDashboard navigation={navigation} />;
    case 'site_admin':
      return <SiteAdminDashboard navigation={navigation} />;
    case 'trial_lead':
      return <TrialLeadDashboard navigation={navigation} />;
    case 'site_user':
      return <SiteUserDashboard navigation={navigation} />;
    default:
      return <CROAdminDashboard navigation={navigation} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.color.background.page,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  errorText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.error,
  },
  placeholderText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
    textAlign: 'center' as any,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { CROAdminDashboard } from '../components/dashboards/CROAdminDashboard';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/AppNavigator';
import designTokens from '../design-tokens.json';

type HomeScreenProps = DrawerScreenProps<DrawerParamList, 'Home'>;

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, loading } = useAuth();

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

  // For now, show CRO Admin Dashboard for all roles
  // TODO: Add other dashboards based on role
  return <CROAdminDashboard navigation={navigation} />;
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
});

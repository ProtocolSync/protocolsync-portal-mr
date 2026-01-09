import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { ENV } from '../../config/env';
import { AppFooter } from '../common/AppFooter';
import designTokens from '../../design-tokens.json';

interface Site {
  id: string;
  site_name: string;
  site_number: string;
  status: string;
}

interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalAdmins: number;
  totalUsers: number;
  subscriptionStatus: string;
  nextBillingDate: string;
}

interface CROAdminDashboardProps {
  navigation: DrawerNavigationProp<DrawerParamList, 'Home'>;
}

export const CROAdminDashboard = ({ navigation }: CROAdminDashboardProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSites: 0,
    activeSites: 0,
    totalAdmins: 0,
    totalUsers: 0,
    subscriptionStatus: 'active',
    nextBillingDate: '2025-12-15',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      console.log('API URL:', ENV.API_URL);
      console.log('User:', user);
      console.log('Company ID:', user?.company?.id);

      const companyId = user?.company?.id;
      if (!companyId) {
        console.error('❌ No company ID found');
        return;
      }

      // Fetch sites
      const sitesUrl = `${ENV.API_URL}/sites`;
      console.log('Fetching sites from:', sitesUrl);

      const sitesResponse = await fetch(sitesUrl, {
        headers: {
          'X-API-Key': ENV.API_KEY,
        },
      });

      if (!sitesResponse.ok) {
        const errorText = await sitesResponse.text();
        console.error('Sites API error:', sitesResponse.status, errorText);
        throw new Error(`Sites API error: ${sitesResponse.status}`);
      }

      const sitesResult = await sitesResponse.json();
      const sitesData = sitesResult.data || sitesResult;
      console.log('✅ Sites fetched:', sitesData.length);

      // Fetch admins - using company-specific endpoint
      const adminsUrl = `${ENV.API_URL}/companies/${companyId}/site-administrators`;
      console.log('Fetching admins from:', adminsUrl);

      const adminsResponse = await fetch(adminsUrl, {
        headers: {
          'X-API-Key': ENV.API_KEY,
        },
      });

      if (!adminsResponse.ok) {
        const errorText = await adminsResponse.text();
        console.error('Admins API error:', adminsResponse.status, errorText);
        throw new Error(`Admins API error: ${adminsResponse.status}`);
      }

      const adminsResult = await adminsResponse.json();
      const adminsData = adminsResult.data || adminsResult;
      console.log('✅ Admins fetched:', adminsData.length);

      // Fetch users - using company-specific endpoint
      const usersUrl = `${ENV.API_URL}/companies/${companyId}/users`;
      console.log('Fetching users from:', usersUrl);

      const usersResponse = await fetch(usersUrl, {
        headers: {
          'X-API-Key': ENV.API_KEY,
        },
      });

      if (!usersResponse.ok) {
        const errorText = await usersResponse.text();
        console.error('Users API error:', usersResponse.status, errorText);
        throw new Error(`Users API error: ${usersResponse.status}`);
      }

      const usersResult = await usersResponse.json();
      const usersData = usersResult.data || usersResult;
      console.log('✅ Users fetched:', usersData.length);

      setStats({
        totalSites: sitesData.length,
        activeSites: sitesData.filter((s: Site) => s.status === 'active').length,
        totalAdmins: adminsData.length,
        totalUsers: usersData.length,
        subscriptionStatus: 'active', // TODO: Get from user company data
        nextBillingDate: '2025-12-15', // TODO: Get from user company data
      });

      console.log('✅ Dashboard data loaded successfully');
      console.log('📊 Stats:', {
        totalSites: sitesData.length,
        activeSites: sitesData.filter((s: Site) => s.status === 'active').length,
        totalAdmins: adminsData.length,
        totalUsers: usersData.length,
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleNavigate = (screen: string) => {
    // Map display names to route names
    const screenMap: Record<string, keyof DrawerParamList> = {
      'Sites': 'Sites',
      'Site Administrators': 'Admins',
      'Users': 'Users',
      'Billing': 'Billing',
    };

    const routeName = screenMap[screen];
    if (routeName) {
      navigation.navigate(routeName);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>CRO Admin Dashboard</Text>
          <Text style={styles.subtitle}>Overview of all sites, administrators, and billing</Text>
        </View>

        {/* Overview Statistics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview Statistics</Text>
          <View style={styles.statsGrid}>
            {/* Total Sites */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleNavigate('Sites')}
            >
              <Text style={styles.statLabel}>Total Sites</Text>
              <Text style={styles.statNumber}>{stats.totalSites}</Text>
              <Text style={styles.statSubtext}>{stats.activeSites} active</Text>
            </TouchableOpacity>

            {/* Site Administrators */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleNavigate('Site Administrators')}
            >
              <Text style={styles.statLabel}>Site Administrators</Text>
              <Text style={styles.statNumber}>{stats.totalAdmins}</Text>
            </TouchableOpacity>

            {/* Total Users */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleNavigate('Users')}
            >
              <Text style={styles.statLabel}>Total Users</Text>
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            </TouchableOpacity>

            {/* Billing Status */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleNavigate('Billing')}
            >
              <Text style={styles.statLabel}>Billing Status</Text>
              <Text style={[styles.statNumber, styles.billingStatus]}>
                {stats.subscriptionStatus}
              </Text>
              <Text style={styles.statSubtext}>
                Next billing: {new Date(stats.nextBillingDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonGreen]}
              onPress={() => handleNavigate('Sites')}
            >
              <Text style={styles.actionIcon}>🏥</Text>
              <Text style={styles.actionText}>Manage Sites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonBlue]}
              onPress={() => handleNavigate('Site Administrators')}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionText}>Manage Site Administrators</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCyan]}
              onPress={() => handleNavigate('Users')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonYellow]}
              onPress={() => handleNavigate('Billing')}
            >
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={styles.actionText}>Manage Billing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as any,
    color: '#1E3A52',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500' as any,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700' as any,
    color: '#1E3A52',
    marginVertical: 8,
  },
  statSubtext: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600' as any,
  },
  billingStatus: {
    fontSize: 20,
    textTransform: 'capitalize' as any,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  actionButtonGreen: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  actionButtonBlue: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  actionButtonCyan: {
    borderColor: '#06B6D4',
    backgroundColor: '#FFFFFF',
  },
  actionButtonYellow: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#1E3A52',
    fontWeight: '500' as any,
    flex: 1,
  },
});

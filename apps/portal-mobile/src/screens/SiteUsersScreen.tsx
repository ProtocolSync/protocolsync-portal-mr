import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { sitesService } from '../services/apiClient';
import { AppFooter } from '../components/common/AppFooter';
import { AddSiteUserModal } from '../components/modals/AddSiteUserModal';
import { UserDetailModal } from '../components/modals/UserDetailModal';
import { AssignUserToTrialModal } from '../components/modals/AssignUserToTrialModal';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type SiteUsersScreenProps = DrawerScreenProps<DrawerParamList, 'SiteUsers'>;

interface SiteUser {
  user_id: number;
  name: string;
  email: string;
  job_title?: string;
  role: string;
  status: string;
  trial_assignments?: any[];
  assigned_at?: string;
}

export const SiteUsersScreen = ({ navigation }: SiteUsersScreenProps) => {
  const { user } = useAuth();
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SiteUser | null>(null);
  const [userToAssign, setUserToAssign] = useState<SiteUser | null>(null);
  const [siteId, setSiteId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.site?.id) {
      setSiteId(user.site.id);
      fetchSiteUsers(user.site.id);
    }
  }, [user]);

  const fetchSiteUsers = useCallback(async (id: number) => {
    try {
      console.log('🔄 Fetching site users for site:', id);
      
      const response = await sitesService.getSiteUsers(id);

      console.log('✅ Site users fetched:', response);

      if (response.success && response.data) {
        setSiteUsers(response.data);
      } else {
        setSiteUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching site users:', error);
      setSiteUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    if (siteId) {
      setRefreshing(true);
      fetchSiteUsers(siteId);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    if (siteId) {
      fetchSiteUsers(siteId);
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('[Export] Starting CSV export for site users');
      console.log('[Export] Platform:', Platform.OS);

      // Generate CSV content
      const headers = ['Name', 'Email', 'Job Title', 'Role', 'Status', 'Trials', 'Assigned Date'];
      const rows = siteUsers.map(siteUser => [
        siteUser.name || '',
        siteUser.email || '',
        siteUser.job_title || '',
        siteUser.role || '',
        siteUser.status || '',
        siteUser.trial_assignments?.length.toString() || '0',
        siteUser.assigned_at || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      console.log('[Export] CSV content created, length:', csvContent.length);

      const fileName = `site_users_${new Date().toISOString().split('T')[0]}.csv`;

      // Check if we're on web
      if (Platform.OS === 'web') {
        console.log('[Export] Using web download method');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('[Export] Web download completed');
        return;
      }

      // Native platform (iOS/Android)
      console.log('[Export] Using native file system method');

      if (!FileSystem.cacheDirectory) {
        console.error('[Export] Cache directory not available');
        Alert.alert('Error', 'File system not available');
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      console.log('[Export] Writing to file:', fileUri);

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('[Export] File written successfully');

      const sharingAvailable = await Sharing.isAvailableAsync();
      console.log('[Export] Sharing available:', sharingAvailable);

      if (sharingAvailable) {
        console.log('[Export] Sharing file...');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Site Users',
          UTI: 'public.comma-separated-values-text',
        });
        console.log('[Export] Share completed');
      } else {
        console.error('[Export] Sharing not available');
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('[Export] Error exporting CSV:', error);
      console.error('[Export] Error message:', error.message);
      console.error('[Export] Error stack:', error.stack);
      Alert.alert('Error', `Failed to export CSV: ${error.message || 'Unknown error'}`);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#EF4444';
      case 'site_admin':
        return '#F59E0B';
      case 'trial_lead':
        return '#3B82F6';
      case 'site_user':
        return '#06B6D4';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'inactive':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      site_admin: 'Site Admin',
      trial_lead: 'Trial Lead',
      site_user: 'Site User',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
        <Text style={styles.loadingText}>Loading site users...</Text>
      </View>
    );
  }

  if (!siteId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Site information not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.pageTitle}>Site Users</Text>
          <Text style={styles.pageSubtitle}>View and manage users assigned to this trial site</Text>
        </View>
        <View style={styles.headerActions}>
          {siteUsers.length > 0 && (
            <IconButton
              icon="download"
              size={24}
              iconColor={designTokens.color.accent.green600}
              onPress={handleExportCSV}
            />
          )}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.createButtonText}>+ Add Site User</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Site Users List */}
        {siteUsers.length > 0 ? (
          <>
            {siteUsers.map((siteUser) => (
              <View key={siteUser.user_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.userName}>{siteUser.name}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(siteUser.status) }]}>
                      <Text style={styles.badgeText}>{siteUser.status}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.userEmail}>{siteUser.email}</Text>

                <View style={styles.userDetails}>
                  {siteUser.job_title && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>JOB TITLE</Text>
                      <Text style={styles.detailValue}>{siteUser.job_title}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ROLE</Text>
                    <View style={[styles.badge, { backgroundColor: getRoleColor(siteUser.role) }]}>
                      <Text style={styles.badgeText}>{getRoleLabel(siteUser.role)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>TRIALS</Text>
                    <Text style={styles.detailValue}>
                      {siteUser.trial_assignments?.length || 0} {siteUser.trial_assignments?.length === 1 ? 'trial' : 'trials'}
                    </Text>
                  </View>

                  {siteUser.assigned_at && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ASSIGNED DATE</Text>
                      <Text style={styles.detailValue}>
                        {new Date(siteUser.assigned_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <IconButton
                    icon="eye"
                    size={20}
                    iconColor={designTokens.color.accent.green600}
                    onPress={() => setSelectedUser(siteUser)}
                  />
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor={designTokens.color.accent.green600}
                    onPress={() => setUserToAssign(siteUser)}
                  />
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>No Site Users yet.</Text>
            <Text style={styles.emptyStateText}>
              Get started by adding users to this site. Site users can be assigned to trials and perform various roles.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>+ Add Your First Site User</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <AppFooter />

      {/* Modals */}
      <AddSiteUserModal
        visible={showAddModal}
        siteId={siteId}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {userToAssign && (
        <AssignUserToTrialModal
          visible={true}
          user={userToAssign}
          siteId={siteId}
          onClose={() => setUserToAssign(null)}
          onSuccess={handleAddSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  container: {
    flex: 1,
  },
  pageHeader: {
    backgroundColor: '#FFFFFF',
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.s,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  createButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: designTokens.spacing.m,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as any,
  },
  listContainer: {
    padding: designTokens.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.color.background.page,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.s,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.s,
    flex: 1,
  },
  userName: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  userEmail: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.m,
  },
  userDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  detailLabel: {
    fontSize: designTokens.typography.fontSize.s,
    fontWeight: '600' as any,
    color: designTokens.color.text.subtle,
    textTransform: 'uppercase' as any,
  },
  detailValue: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as any,
    color: '#FFFFFF',
    textTransform: 'capitalize' as any,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: designTokens.spacing.s,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    paddingTop: designTokens.spacing.s,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as any,
    marginBottom: 24,
    maxWidth: 400,
  },
  emptyStateButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as any,
  },
});

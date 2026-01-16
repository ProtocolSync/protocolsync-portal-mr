import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Button, Chip, Avatar, IconButton } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { usersService, sitesService } from '../services/apiClient';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { AppFooter } from '../components/common/AppFooter';
import { UserDetailModal } from '../components/modals/UserDetailModal';
import { AddUserModal, AddUserFormData } from '../components/modals/AddUserModal';
import { ToggleUserStatusModal } from '../components/modals/ToggleUserStatusModal';
import { ResendInvitationModal } from '../components/modals/ResendInvitationModal';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface User {
  user_id: number;
  name: string;
  email: string;
  job_title?: string;
  department?: string;
  professional_credentials?: string;
  phone?: string;
  role: 'admin' | 'site_admin' | 'trial_lead' | 'site_user';
  status: 'active' | 'pending' | 'inactive';
  last_login_at?: string;
  assigned_sites?: string;
  site_count?: string;
}

interface Site {
  site_id: number;
  site_name: string;
  site_number: string;
  institution_name: string;
}

const roleColors: Record<string, string> = {
  admin: '#8B5CF6',
  site_admin: '#3B82F6',
  trial_lead: '#10B981',
  site_user: '#6B7280',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  site_admin: 'Site Admin',
  trial_lead: 'Trial Lead',
  site_user: 'Site User',
};

export const UsersScreen = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [actionUser, setActionUser] = useState<User | null>(null);

  // Add User modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const companyId = user?.company?.id;

      if (!companyId) {
        setError('Company information not available');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await usersService.getCompanyUsers(companyId);

      if (response.success && response.data !== undefined) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const handleToggleStatus = async (userToToggle: User) => {
    const companyId = user?.company?.id;
    if (!companyId) {
      throw new Error('Company information not available');
    }

    const newStatus = userToToggle.status === 'active' || userToToggle.status === 'pending' ? 'inactive' : 'active';
    const response = await usersService.updateUserStatus(companyId, userToToggle.user_id, newStatus);

    if (response.success) {
      await fetchUsers();
      setShowToggleModal(false);
      setActionUser(null);
    } else {
      throw new Error(response.error || 'Failed to update user status');
    }
  };

  const handleResendInvitation = async (userToResend: User) => {
    const response = await usersService.resendInvitation(userToResend.user_id);

    if (response.success) {
      setShowResendModal(false);
      setActionUser(null);
    } else {
      throw new Error(response.error || 'Failed to resend invitation');
    }
  };

  const fetchSites = async () => {
    if (!user?.company?.id) return;

    setLoadingSites(true);
    try {
      const response = await sitesService.getSites(user.company.id);

      if (response.success && response.data) {
        setSites(response.data);
      } else {
        console.error('Failed to fetch sites:', response.error);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoadingSites(false);
    }
  };

  const handleAddUser = async (formData: AddUserFormData) => {
    const companyId = user?.company?.id;
    if (!companyId) {
      throw new Error('Company information not available');
    }

    const userData = {
      email: formData.email,
      name: formData.name,
      job_title: formData.job_title,
      role: formData.role,
    };

    const response = await usersService.createUser(companyId, userData);

    if (response.success) {
      await fetchUsers();
      setShowAddUserModal(false);
    } else {
      throw new Error(response.error || 'Failed to add user');
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('[Export] Starting CSV export for users');
      console.log('[Export] Platform:', Platform.OS);

      // Convert users to CSV format
      const headers = ['Name', 'Email', 'Job Title', 'Role', 'Status', 'Assigned Sites', 'Last Login'];
      const csvData = users.map(u => [
        u.name,
        u.email,
        u.job_title || '',
        roleLabels[u.role] || u.role,
        u.status.toUpperCase(),
        u.assigned_sites || 'None',
        u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      console.log('[Export] CSV content created, length:', csvContent.length);

      const fileName = `users_${new Date().toISOString().split('T')[0]}.csv`;

      // Check if we're on web
      if (Platform.OS === 'web') {
        console.log('[Export] Using web download method');

        // Create a blob and download it
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

      // Check if cache directory is available
      if (!FileSystem.cacheDirectory) {
        console.error('[Export] Cache directory not available');
        setError('File system not available');
        return;
      }

      // Write CSV to a temporary file
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      console.log('[Export] Writing to file:', fileUri);

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('[Export] File written successfully');

      // Check if sharing is available
      const sharingAvailable = await Sharing.isAvailableAsync();
      console.log('[Export] Sharing available:', sharingAvailable);

      if (sharingAvailable) {
        console.log('[Export] Sharing file...');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Users',
          UTI: 'public.comma-separated-values-text',
        });
        console.log('[Export] Share completed');
      } else {
        console.error('[Export] Sharing not available');
        setError('Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('[Export] Error exporting CSV:', error);
      console.error('[Export] Error message:', error.message);
      console.error('[Export] Error stack:', error.stack);
      setError(`Failed to export CSV: ${error.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (showAddUserModal && user?.company?.id) {
      fetchSites();
    }
  }, [showAddUserModal, user?.company?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderUserCard = ({ item }: { item: User }) => {
    const isCurrentUser = item.email === user?.email;
    const isActive = item.status === 'active' || item.status === 'pending';

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => handleUserPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Avatar.Text
              size={48}
              label={getInitials(item.name)}
              style={[styles.avatar, { backgroundColor: roleColors[item.role] }]}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.cardContent}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Chip
                  style={[
                    styles.statusChip,
                    item.status === 'active' ? styles.statusActive :
                    item.status === 'pending' ? styles.statusPending : styles.statusInactive,
                  ]}
                  textStyle={styles.statusText}
                >
                  {item.status.toUpperCase()}
                </Chip>
              </View>
              <Text style={styles.email}>{item.email}</Text>
              <Chip
                style={[styles.roleChip, { backgroundColor: roleColors[item.role] + '20' }]}
                textStyle={[styles.roleText, { color: roleColors[item.role] }]}
              >
                {roleLabels[item.role]}
              </Chip>
              {item.assigned_sites && (
                <Text style={styles.siteInfo}>
                  Sites ({item.site_count}): {item.assigned_sites}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Icons */}
        <View style={styles.actions}>
          <IconButton
            icon="eye"
            size={20}
            iconColor={designTokens.color.accent.green500}
            onPress={() => handleUserPress(item)}
          />
          {item.status === 'pending' && (
            <IconButton
              icon="email-send"
              size={20}
              iconColor="#3B82F6"
              onPress={() => {
                setActionUser(item);
                setShowResendModal(true);
              }}
            />
          )}
          {!isCurrentUser && (
            <IconButton
              icon={isActive ? "close-circle" : "check-circle"}
              size={20}
              iconColor={isActive ? "#F59E0B" : "#10B981"}
              onPress={() => {
                setActionUser(item);
                setShowToggleModal(true);
              }}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading users..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchUsers} />;
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Users</Text>
          <Text style={styles.pageSubtitle}>Manage company users and their permissions</Text>
        </View>
        <View style={styles.headerActions}>
          {users.length > 0 && (
            <IconButton
              icon="download"
              size={24}
              iconColor={designTokens.color.accent.green500}
              onPress={handleExportCSV}
            />
          )}
          {user?.role === 'admin' && (
            <Button
              mode="contained"
              onPress={() => setShowAddUserModal(true)}
              style={styles.addButton}
              icon="plus"
              buttonColor={designTokens.color.accent.green500}
            >
              Add User
            </Button>
          )}
        </View>
      </View>

      <View style={styles.container}>
        {users.length === 0 && !loading && !error ? (
          <EmptyState
            icon="👥"
            title="No Users Found"
            message="Get started by inviting your first user."
            actionLabel={user?.role === 'admin' ? "Add User" : undefined}
            onAction={() => setShowAddUserModal(true)}
          />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserCard}
            keyExtractor={item => item.user_id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={designTokens.color.accent.green500}
              />
            }
          />
        )}
      </View>
      <AppFooter />

      {/* Modals */}
      <UserDetailModal
        visible={showDetailModal}
        user={selectedUser}
        onDismiss={() => setShowDetailModal(false)}
        roleColors={roleColors}
        roleLabels={roleLabels}
      />

      <AddUserModal
        visible={showAddUserModal}
        onDismiss={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
        sites={sites}
        loadingSites={loadingSites}
      />

      <ToggleUserStatusModal
        visible={showToggleModal}
        user={actionUser}
        onDismiss={() => setShowToggleModal(false)}
        onConfirm={handleToggleStatus}
      />

      <ResendInvitationModal
        visible={showResendModal}
        user={actionUser}
        onDismiss={() => setShowResendModal(false)}
        onConfirm={handleResendInvitation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  pageHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: designTokens.spacing.l,
    paddingVertical: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.light,
  },
  headerContent: {
    marginBottom: designTokens.spacing.m,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
  },
  pageSubtitle: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  addButton: {
    borderRadius: 8,
  },
  container: {
    flex: 1,
  },
  listContainer: {
    padding: designTokens.spacing.m,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: designTokens.color.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: designTokens.spacing.m,
  },
  avatar: {
    backgroundColor: designTokens.color.accent.green500,
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  name: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.default,
    flex: 1,
  },
  statusChip: {
    height: 24,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  email: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
  },
  roleChip: {
    alignSelf: 'flex-start',
    height: 24,
    marginBottom: designTokens.spacing.xs,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  siteInfo: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginTop: designTokens.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: designTokens.spacing.s,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.light,
    paddingTop: designTokens.spacing.s,
  },
});

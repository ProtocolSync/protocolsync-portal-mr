import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput, Platform } from 'react-native';
import { Button, Chip, Portal, Modal, Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { usersService, sitesService } from '../services/apiClient';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '../design-tokens.json';

interface User {
  user_id: number;
  name: string;
  email: string;
  job_title: string;
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
  const [actionLoading, setActionLoading] = useState(false);

  // Add User modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    role: 'site_user',
    email: '',
    name: '',
    job_title: '',
    site_id: '',
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleToggleStatus = async () => {
    if (!actionUser) return;

    const companyId = user?.company?.id;
    if (!companyId) return;

    setActionLoading(true);
    try {
      const newStatus = actionUser.status === 'active' || actionUser.status === 'pending' ? 'inactive' : 'active';
      const response = await usersService.updateUserStatus(companyId, actionUser.user_id, newStatus);

      if (response.success) {
        fetchUsers();
        setShowToggleModal(false);
        setActionUser(null);
      } else {
        setError(response.error || 'Failed to update user status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!actionUser) return;

    setActionLoading(true);
    try {
      const response = await usersService.resendInvitation(actionUser.user_id);

      if (response.success) {
        setShowResendModal(false);
        setActionUser(null);
      } else {
        setError(response.error || 'Failed to resend invitation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
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

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.name || !addUserForm.role) {
      setError('Email, Full Name, and Organization Role are required');
      return;
    }

    const companyId = user?.company?.id;
    if (!companyId) {
      setError('Company information not available');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const userData = {
        email: addUserForm.email,
        name: addUserForm.name,
        job_title: addUserForm.job_title,
        role: addUserForm.role,
      };

      const response = await usersService.createUser(companyId, userData);

      if (response.success) {
        setShowAddUserModal(false);
        setAddUserForm({
          role: 'site_user',
          email: '',
          name: '',
          job_title: '',
          site_id: '',
        });
        fetchUsers();
      } else {
        setError(response.error || 'Failed to add user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
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

      {/* User Detail Modal */}
      <Portal>
        <Modal
          visible={showDetailModal}
          onDismiss={() => setShowDetailModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Avatar.Text
                  size={64}
                  label={getInitials(selectedUser.name)}
                  style={[styles.modalAvatar, { backgroundColor: roleColors[selectedUser.role] }]}
                  labelStyle={styles.modalAvatarLabel}
                />
              </View>

              <Text style={styles.modalTitle}>{selectedUser.name}</Text>

              <View style={styles.modalChips}>
                <Chip
                  style={[
                    styles.statusChip,
                    selectedUser.status === 'active' ? styles.statusActive :
                    selectedUser.status === 'pending' ? styles.statusPending : styles.statusInactive,
                  ]}
                  textStyle={styles.statusText}
                >
                  {selectedUser.status.toUpperCase()}
                </Chip>
                <Chip
                  style={[styles.roleChip, { backgroundColor: roleColors[selectedUser.role] + '20' }]}
                  textStyle={[styles.roleText, { color: roleColors[selectedUser.role] }]}
                >
                  {roleLabels[selectedUser.role]}
                </Chip>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Job Title</Text>
                <Text style={styles.detailValue}>{selectedUser.job_title}</Text>
              </View>

              {selectedUser.department && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Department</Text>
                  <Text style={styles.detailValue}>{selectedUser.department}</Text>
                </View>
              )}

              {selectedUser.assigned_sites && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Assigned Sites ({selectedUser.site_count})</Text>
                  <Text style={styles.detailValue}>{selectedUser.assigned_sites}</Text>
                </View>
              )}

              {selectedUser.last_login_at && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Last Login</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedUser.last_login_at).toLocaleString()}
                  </Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
                buttonColor={designTokens.color.accent.green500}
              >
                Close
              </Button>
            </ScrollView>
          )}
        </Modal>

        {/* Toggle Status Confirmation Modal */}
        <Modal
          visible={showToggleModal}
          onDismiss={() => setShowToggleModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {actionUser && (
              <>
                <Text style={styles.modalTitle}>
                  {actionUser.status === 'active' || actionUser.status === 'pending' ? 'Deactivate' : 'Activate'} User
                </Text>
                <Text style={styles.modalText}>
                  {actionUser.status === 'active' || actionUser.status === 'pending'
                    ? `Are you sure you want to deactivate ${actionUser.name}? They will no longer be able to access the system.`
                    : `Are you sure you want to activate ${actionUser.name}? They will regain access to the system.`
                  }
                </Text>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowToggleModal(false)}
                    style={styles.cancelButton}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleToggleStatus}
                    style={styles.submitButton}
                    buttonColor={actionUser.status === 'active' || actionUser.status === 'pending' ? '#F59E0B' : '#10B981'}
                    loading={actionLoading}
                    disabled={actionLoading}
                  >
                    {actionUser.status === 'active' || actionUser.status === 'pending' ? 'Deactivate' : 'Activate'}
                  </Button>
                </View>
              </>
            )}
          </View>
        </Modal>

        {/* Resend Invitation Confirmation Modal */}
        <Modal
          visible={showResendModal}
          onDismiss={() => setShowResendModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {actionUser && (
              <>
                <Text style={styles.modalTitle}>Resend Invitation</Text>
                <Text style={styles.modalText}>
                  Send a new invitation email to {actionUser.name} ({actionUser.email})?
                </Text>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowResendModal(false)}
                    style={styles.cancelButton}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleResendInvitation}
                    style={styles.submitButton}
                    buttonColor={designTokens.color.accent.green500}
                    loading={actionLoading}
                    disabled={actionLoading}
                  >
                    Resend
                  </Button>
                </View>
              </>
            )}
          </View>
        </Modal>

        {/* Add User Modal */}
        <Modal
          visible={showAddUserModal}
          onDismiss={() => setShowAddUserModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Organization Role */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Organization Role *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={addUserForm.role}
                  onValueChange={(value) => setAddUserForm({ ...addUserForm, role: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Site User" value="site_user" />
                  <Picker.Item label="Trial Lead" value="trial_lead" />
                  <Picker.Item label="Site Administrator" value="site_admin" />
                </Picker>
              </View>
              <Text style={styles.formHelperText}>
                Site Users participate in trials. Trial Leads manage protocol versions and delegations for their trials. Site Administrators manage trials and site users.
              </Text>
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={addUserForm.email}
                onChangeText={(value) => setAddUserForm({ ...addUserForm, email: value })}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </View>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={addUserForm.name}
                onChangeText={(value) => setAddUserForm({ ...addUserForm, name: value })}
                placeholder="Jane Smith"
                editable={!submitting}
              />
            </View>

            {/* Job Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Job Title</Text>
              <TextInput
                style={styles.input}
                value={addUserForm.job_title}
                onChangeText={(value) => setAddUserForm({ ...addUserForm, job_title: value })}
                placeholder="Clinical Research Coordinator"
                editable={!submitting}
              />
            </View>

            {/* Assign to Site */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Assign to Site {user?.role === 'admin' ? '(Optional)' : ''}
              </Text>
              {loadingSites ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={designTokens.color.accent.green500} />
                  <Text style={styles.loadingText}>Loading sites...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={addUserForm.site_id}
                      onValueChange={(value) => setAddUserForm({ ...addUserForm, site_id: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="-- No site assignment --" value="" />
                      {sites.map((site) => (
                        <Picker.Item
                          key={site.site_id}
                          label={`${site.site_number} - ${site.site_name} (${site.institution_name})`}
                          value={site.site_id.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                  <Text style={styles.formHelperText}>
                    {user?.role === 'admin'
                      ? 'Select a site to assign the user to a specific site, or leave blank to create a company-level user.'
                      : 'Select the site where this user will work.'
                    }
                  </Text>
                </>
              )}
            </View>

            {/* Info Alert */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                ℹ️ User will receive an Entra ID invitation email and must complete registration before they can log in.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowAddUserModal(false)}
                style={styles.cancelButton}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddUser}
                style={styles.submitButton}
                buttonColor={designTokens.color.accent.green500}
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? 'Adding User...' : 'Add User'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: designTokens.spacing.m,
    maxHeight: '80%',
  },
  modalContent: {
    padding: designTokens.spacing.l,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.m,
  },
  modalAvatar: {
    backgroundColor: designTokens.color.accent.green500,
  },
  modalAvatarLabel: {
    fontSize: 28,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '600',
    color: designTokens.color.text.default,
    textAlign: 'center',
    marginBottom: designTokens.spacing.m,
  },
  modalText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    textAlign: 'center',
    marginBottom: designTokens.spacing.l,
  },
  modalChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.s,
    marginBottom: designTokens.spacing.l,
  },
  detailSection: {
    marginBottom: designTokens.spacing.m,
  },
  detailLabel: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: designTokens.spacing.l,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.m,
  },
  errorText: {
    color: '#DC2626',
    fontSize: designTokens.typography.fontSize.m,
  },
  modalActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.m,
    marginTop: designTokens.spacing.l,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  formGroup: {
    marginBottom: designTokens.spacing.l,
  },
  formLabel: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
  },
  formHelperText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginTop: designTokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: designTokens.color.border.light,
    borderRadius: designTokens.spacing.xs,
    padding: designTokens.spacing.m,
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.light,
    borderRadius: designTokens.spacing.xs,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.m,
    backgroundColor: '#F3F4F6',
    borderRadius: designTokens.spacing.xs,
  },
  loadingText: {
    marginLeft: designTokens.spacing.m,
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  infoContainer: {
    backgroundColor: '#DBEAFE',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.l,
  },
  infoText: {
    fontSize: designTokens.typography.fontSize.s,
    color: '#1E40AF',
  },
});

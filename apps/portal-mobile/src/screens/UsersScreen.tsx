import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Button, Chip, FAB, Portal, Modal, Avatar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
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

      const response = await api.get<{ data: User[] }>(`/companies/${companyId}/users`);

      if (response.success && response.data) {
        setUsers(response.data.data || []);
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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


  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.card}
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
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading users..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchUsers} />;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {users.length === 0 && !loading && !error ? (
          <EmptyState
            icon="👥"
            title="No Users Found"
            message="Get started by inviting your first user."
            actionLabel={user?.role === 'admin' ? "Add User" : undefined}
            onAction={() => {/* TODO: Add user modal */}}
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
                tintColor={designTokens.color.accent.green600}
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
                mode="outlined"
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                Close
              </Button>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* FAB for adding new user (admin only) */}
      {user?.role === 'admin' && (
        <FAB
          icon="plus"
          style={styles.fab}
          color="#FFFFFF"
          onPress={() => {/* TODO: Add user modal */}}
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
  listContainer: {
    padding: designTokens.spacing.m,
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
    gap: designTokens.spacing.m,
  },
  avatar: {
    backgroundColor: designTokens.color.accent.green600,
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
    color: designTokens.color.text.heading,
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
    color: designTokens.color.text.body,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: designTokens.color.accent.green600,
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
    backgroundColor: designTokens.color.accent.green600,
  },
  modalAvatarLabel: {
    fontSize: 28,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    textAlign: 'center',
    marginBottom: designTokens.spacing.m,
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
    color: designTokens.color.text.body,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: designTokens.spacing.l,
  },
});

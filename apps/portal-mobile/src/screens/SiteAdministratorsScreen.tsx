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

interface SiteAdministrator {
  user_id: number;
  name: string;
  email: string;
  job_title: string;
  department?: string;
  professional_credentials?: string;
  phone?: string;
  site_id: number;
  site_number: string;
  site_name: string;
  institution_name: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
  last_login_at?: string;
}

export const SiteAdministratorsScreen = () => {
  const { user } = useAuth();
  const [administrators, setAdministrators] = useState<SiteAdministrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<SiteAdministrator | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAdministrators = useCallback(async () => {
    try {
      setError(null);
      const companyId = user?.company?.id;

      if (!companyId) {
        setError('Company information not available');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await api.get<{ data: SiteAdministrator[] }>(`/companies/${companyId}/administrators`);

      if (response.success && response.data) {
        setAdministrators(response.data.data || []);
      } else {
        setError(response.error || 'Failed to load administrators');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdministrators();
  }, [fetchAdministrators]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdministrators();
  }, [fetchAdministrators]);

  const handleAdminPress = (admin: SiteAdministrator) => {
    setSelectedAdmin(admin);
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


  const renderAdminCard = ({ item }: { item: SiteAdministrator }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleAdminPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Avatar.Text
          size={48}
          label={getInitials(item.name)}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Chip
              style={[
                styles.statusChip,
                item.status === 'active' ? styles.statusActive : styles.statusInactive,
              ]}
              textStyle={styles.statusText}
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.jobTitle}>{item.job_title}</Text>
          <View style={styles.siteInfo}>
            <Text style={styles.siteLabel}>Site: </Text>
            <Text style={styles.siteName}>
              #{item.site_number} - {item.site_name}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading administrators..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchAdministrators} />;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
      {administrators.length === 0 && !loading && !error ? (
        <EmptyState
          icon="👤"
          title="No Site Administrators Found"
          message="Get started by adding your first site administrator."
          actionLabel={user?.role === 'admin' ? "Add Administrator" : undefined}
          onAction={() => {/* TODO: Add administrator modal */}}
        />
      ) : (
        <FlatList
          data={administrators}
          renderItem={renderAdminCard}
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

      {/* Administrator Detail Modal */}
      <Portal>
        <Modal
          visible={showDetailModal}
          onDismiss={() => setShowDetailModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedAdmin && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Avatar.Text
                  size={64}
                  label={getInitials(selectedAdmin.name)}
                  style={styles.modalAvatar}
                  labelStyle={styles.modalAvatarLabel}
                />
              </View>

              <Text style={styles.modalTitle}>{selectedAdmin.name}</Text>

              <Chip
                style={[
                  styles.statusChip,
                  styles.statusChipCentered,
                  selectedAdmin.status === 'active' ? styles.statusActive : styles.statusInactive,
                ]}
                textStyle={styles.statusText}
              >
                {selectedAdmin.status.toUpperCase()}
              </Chip>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedAdmin.email}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Job Title</Text>
                <Text style={styles.detailValue}>{selectedAdmin.job_title}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Site</Text>
                <Text style={styles.detailValue}>
                  #{selectedAdmin.site_number} - {selectedAdmin.site_name}
                </Text>
              </View>

              {selectedAdmin.last_login_at && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Last Login</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAdmin.last_login_at).toLocaleString()}
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

      {/* FAB for adding new administrator (admin only) */}
      {user?.role === 'admin' && (
        <FAB
          icon="plus"
          style={styles.fab}
          color="#FFFFFF"
          onPress={() => {/* TODO: Add administrator modal */}}
        />
      )}
      <AppFooter />
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
  statusChipCentered: {
    alignSelf: 'center',
    marginBottom: designTokens.spacing.l,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
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
  jobTitle: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
  },
  siteInfo: {
    flexDirection: 'row',
    marginTop: designTokens.spacing.xs,
  },
  siteLabel: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    fontWeight: '600',
  },
  siteName: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.accent.green600,
    flex: 1,
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

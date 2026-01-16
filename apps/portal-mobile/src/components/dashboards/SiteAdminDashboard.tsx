import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { trialsService } from '../../services/apiClient';
import { AppFooter } from '../common/AppFooter';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';
import type { Trial } from '@protocolsync/shared-services';

interface SiteAdminDashboardProps {
  navigation: DrawerNavigationProp<DrawerParamList, 'Home'>;
}

export const SiteAdminDashboard = ({ navigation }: SiteAdminDashboardProps) => {
  const { user } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTrials();
    }
  }, [user?.id]);

  const fetchTrials = async () => {
    try {
      console.log('🔄 Fetching trials for user:', user?.id);
      
      const response = await trialsService.getTrials({
        userId: user?.id,
        status: 'active',
      });

      console.log('✅ Trials fetched:', response);

      if (response.success && response.data) {
        setTrials(response.data);
      } else {
        setTrials([]);
      }
    } catch (error) {
      console.error('❌ Error fetching trials:', error);
      setTrials([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrials();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10B981';
      case 'paused':
        return '#F59E0B';
      case 'closed':
        return '#6B7280';
      case 'completed':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getPhaseColor = (phase?: string) => {
    if (!phase) return '#6B7280';
    switch (phase.toLowerCase()) {
      case 'phase i':
        return '#3B82F6';
      case 'phase ii':
        return '#6366F1';
      case 'phase iii':
        return '#F59E0B';
      case 'phase iv':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const activeTrial = trials.find(t => t.status === 'active');

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
          <Text style={styles.title}>Site Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage your clinical trials and site operations</Text>
        </View>

        {/* Active Trials Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔬 Active Trials</Text>
          </View>

          {trials.length > 0 ? (
            <View>
              {/* Summary Header */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryNumber}>
                  {trials.filter(t => t.status === 'active').length}
                </Text>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryText}>
                    active {trials.filter(t => t.status === 'active').length === 1 ? 'trial' : 'trials'} at this site
                  </Text>
                  <Text style={styles.summarySubtext}>Total trials: {trials.length}</Text>
                </View>
              </View>

              {/* Trial Details */}
              {activeTrial && (
                <View style={styles.trialCard}>
                  <View style={styles.trialHeader}>
                    <Text style={styles.trialName}>{activeTrial.trial_name}</Text>
                    <Text style={styles.trialNumber}>{activeTrial.trial_number}</Text>
                  </View>

                  <View style={styles.trialDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>PROTOCOL</Text>
                      <Text style={styles.detailValue}>{activeTrial.protocol_number || '-'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>PHASE</Text>
                      {activeTrial.phase ? (
                        <View style={[styles.badge, { backgroundColor: getPhaseColor(activeTrial.phase) }]}>
                          <Text style={styles.badgeText}>{activeTrial.phase}</Text>
                        </View>
                      ) : (
                        <Text style={styles.detailValue}>-</Text>
                      )}
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>STATUS</Text>
                      <View style={[styles.badge, { backgroundColor: getStatusColor(activeTrial.status) }]}>
                        <Text style={styles.badgeText}>{activeTrial.status}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>PI</Text>
                      <Text style={styles.detailValue}>
                        {activeTrial.pi_name || <Text style={styles.detailValueItalic}>Not assigned</Text>}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>TEAM MEMBERS</Text>
                      <View style={styles.membersBadge}>
                        <Text style={styles.membersBadgeText}>
                          {activeTrial.assigned_user_count} {activeTrial.assigned_user_count === 1 ? 'member' : 'members'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>DOCUMENTS</Text>
                      <Text style={styles.detailValue}>{activeTrial.document_count || 0}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No trials found at this site</Text>
              <Text style={styles.emptyStateSubtext}>Create a new trial to get started</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🆕 Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => {/* TODO: Navigate to create trial */}}
            >
              <Text style={styles.actionText}>Create New Trial</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={() => {/* TODO: Navigate to site users */}}
            >
              <Text style={[styles.actionText, styles.actionTextOutline]}>Manage Site Users</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Site Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Site Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Trials</Text>
              <Text style={styles.statValue}>{trials.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Trials</Text>
              <Text style={[styles.statValue, styles.statValueSuccess]}>
                {trials.filter(t => t.status === 'active').length}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Team Members</Text>
              <Text style={styles.statValue}>
                {trials.reduce((sum, t) => sum + (t.assigned_user_count || 0), 0)}
              </Text>
            </View>
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
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  summaryNumber: {
    fontSize: 72,
    fontWeight: '700' as any,
    color: '#10B981',
    lineHeight: 72,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  trialCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  trialHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  trialName: {
    fontSize: 18,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 4,
  },
  trialNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  trialDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: '#6B7280',
    textTransform: 'uppercase' as any,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E3A52',
  },
  detailValueItalic: {
    fontStyle: 'italic' as any,
    color: '#9CA3AF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: '#FFFFFF',
    textTransform: 'capitalize' as any,
  },
  membersBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E0E7FF',
  },
  membersBadgeText: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: '#3730A3',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
  },
  actionButtonPrimary: {
    backgroundColor: designTokens.color.accent.green500,
  },
  actionButtonOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: designTokens.color.accent.green500,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: '#FFFFFF',
  },
  actionTextOutline: {
    color: designTokens.color.accent.green500,
  },
  actionArrow: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  statsGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: '#1E3A52',
  },
  statValueSuccess: {
    color: '#10B981',
  },
});

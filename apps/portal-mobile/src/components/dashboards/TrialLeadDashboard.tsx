import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAuth } from '../../contexts/AuthContext';
import { trialsService } from '../../services/apiClient';
import { AppFooter } from '../common/AppFooter';
import designTokens from '../../design-tokens.json';

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  protocol_number?: string;
  phase?: string;
  status: string;
  pi_name?: string;
  assigned_user_count: number;
  document_count?: number;
  trial_role?: string;
  site_name?: string;
  created_at: string;
}

interface DrawerParamList {
  Home: undefined;
  Protocols: undefined;
  DelegationLog: undefined;
}

interface TrialLeadDashboardProps {
  navigation: DrawerNavigationProp<DrawerParamList, 'Home'>;
}

export const TrialLeadDashboard = ({ navigation }: TrialLeadDashboardProps) => {
  const { user } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchTrials();
    }
  }, [user?.user_id]);

  const fetchTrials = async () => {
    try {
      console.log('🔄 Fetching trials for Trial Lead user:', user?.user_id);
      
      const response = await trialsService.getTrials({
        userId: user?.user_id,
      });

      console.log('✅ Trial Lead trials fetched:', response);

      if (response.success && response.data) {
        // Filter to only active trials
        const activeTrials = response.data.filter((t: Trial) =>
          t.status === 'active' || t.status === 'enrolling'
        );
        setTrials(activeTrials);
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
      case 'enrolling':
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
          <Text style={styles.title}>Trial Lead Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage protocol versions and delegations for your assigned trials
          </Text>
        </View>

        {/* My Assigned Trials Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔬 My Assigned Trials</Text>
          </View>

          {trials.length > 0 ? (
            <View>
              {/* Summary Header */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryNumber}>{trials.length}</Text>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryText}>
                    active {trials.length === 1 ? 'trial' : 'trials'} assigned to you
                  </Text>
                  <Text style={styles.summarySubtext}>
                    You can manage protocol versions and delegations for these trials
                  </Text>
                </View>
              </View>

              {/* Trial Cards */}
              <View style={styles.trialsContainer}>
                {trials.map((trial) => (
                  <View key={trial.trial_id} style={styles.trialCard}>
                    <View style={styles.trialHeader}>
                      <Text style={styles.trialName}>{trial.trial_name}</Text>
                      <Text style={styles.trialNumber}>{trial.trial_number}</Text>
                    </View>

                    <View style={styles.trialDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>SITE</Text>
                        <Text style={styles.detailValue}>{trial.site_name || '-'}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>MY ROLE</Text>
                        {trial.trial_role ? (
                          <View style={[styles.badge, { backgroundColor: '#6366F1' }]}>
                            <Text style={styles.badgeText}>{trial.trial_role}</Text>
                          </View>
                        ) : (
                          <Text style={styles.detailValueItalic}>-</Text>
                        )}
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>PHASE</Text>
                        {trial.phase ? (
                          <View style={[styles.badge, { backgroundColor: getPhaseColor(trial.phase) }]}>
                            <Text style={styles.badgeText}>{trial.phase}</Text>
                          </View>
                        ) : (
                          <Text style={styles.detailValueItalic}>-</Text>
                        )}
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>STATUS</Text>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(trial.status) }]}>
                          <Text style={styles.badgeText}>{trial.status}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>TEAM MEMBERS</Text>
                        <View style={styles.membersBadge}>
                          <Text style={styles.membersBadgeText}>
                            {trial.assigned_user_count} {trial.assigned_user_count === 1 ? 'member' : 'members'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>DOCUMENTS</Text>
                        <Text style={styles.detailValue}>{trial.document_count || 0}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔬</Text>
              <Text style={styles.emptyStateText}>No Trials Assigned</Text>
              <Text style={styles.emptyStateSubtext}>
                You haven't been assigned to any trials yet. Contact your site administrator to be assigned to trials.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {trials.length > 0 && (
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Protocols')}
            >
              <View style={styles.actionContent}>
                <Text style={styles.actionIcon}>📄</Text>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Protocol Versions</Text>
                  <Text style={styles.actionSubtitle}>
                    Manage protocol documents and versions for your trials
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('DelegationLog')}
            >
              <View style={styles.actionContent}>
                <Text style={styles.actionIcon}>✍️</Text>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Delegation Log</Text>
                  <Text style={styles.actionSubtitle}>
                    Track and manage delegation of authority for your trials
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
    fontWeight: '700',
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
    fontWeight: '600',
    color: '#1E3A52',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  summaryNumber: {
    fontSize: 72,
    fontWeight: '700',
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
  trialsContainer: {
    gap: 16,
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E3A52',
  },
  detailValueItalic: {
    fontStyle: 'italic',
    color: '#9CA3AF',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  membersBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E0E7FF',
  },
  membersBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A52',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  quickActionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    fontSize: 48,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A52',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

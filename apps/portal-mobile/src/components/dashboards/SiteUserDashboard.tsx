import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAuth } from '../../contexts/AuthContext';
import { AppFooter } from '../common/AppFooter';
import designTokens from '../../design-tokens.json';
import { ENV } from '../../config/env';

interface Delegation {
  delegation_id: number;
  protocol_version_id: number;
  document_master_id?: number;
  protocol_name: string;
  version_number?: string;
  protocol_version?: string;
  trial_role_name: string;
  delegation_date: string;
  effective_start_date: string;
  status: string;
}

interface DrawerParamList {
  Home: undefined;
  Protocols: undefined;
  DelegationLog: undefined;
}

interface SiteUserDashboardProps {
  navigation: DrawerNavigationProp<DrawerParamList, 'Home'>;
}

export const SiteUserDashboard = ({ navigation }: SiteUserDashboardProps) => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDelegations();
    }
  }, [user?.id]);

  const fetchDelegations = async () => {
    try {
      console.log('🔄 Fetching delegations for user:', user?.id);
      
      const response = await fetch(
        `${ENV.API_URL}/compliance/delegations?user_id=${user?.id}`,
        {
          headers: {
            'X-API-Key': ENV.API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delegations API error:', response.status, errorText);
        throw new Error(`Delegations API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Delegations fetched:', result);
      
      setDelegations(result.data || result);
    } catch (error) {
      console.error('❌ Error fetching delegations:', error);
      setDelegations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDelegations();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'accepted':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'revoked':
      case 'declined':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>View protocols delegated to you</Text>
        </View>

        {/* My Delegated Protocols Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📑 My Delegated Protocols</Text>
          </View>

          {delegations.length > 0 ? (
            <View>
              {/* Summary Header */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryNumber}>{delegations.length}</Text>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryText}>
                    {delegations.length === 1 ? 'protocol' : 'protocols'} delegated to you
                  </Text>
                  <Text style={styles.summarySubtext}>
                    These are the protocols assigned for your review
                  </Text>
                </View>
              </View>

              {/* Delegation Cards */}
              <View style={styles.delegationsContainer}>
                {delegations.map((delegation) => (
                  <View key={delegation.delegation_id} style={styles.delegationCard}>
                    <View style={styles.delegationHeader}>
                      <Text style={styles.delegationName}>{delegation.protocol_name}</Text>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>
                          v{delegation.version_number || delegation.protocol_version || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.delegationDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>ROLE</Text>
                        <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
                          <Text style={styles.badgeText}>{delegation.trial_role_name}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>STATUS</Text>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: getStatusColor(delegation.status) },
                          ]}
                        >
                          <Text style={styles.badgeText}>{delegation.status}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>DELEGATION DATE</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(delegation.delegation_date)}
                        </Text>
                      </View>

                      {delegation.effective_start_date && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>EFFECTIVE DATE</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(delegation.effective_start_date)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📑</Text>
              <Text style={styles.emptyStateText}>No Delegated Protocols</Text>
              <Text style={styles.emptyStateSubtext}>
                No protocols have been delegated to you yet
              </Text>
            </View>
          )}
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
  delegationsContainer: {
    gap: 16,
  },
  delegationCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  delegationHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  delegationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A52',
    marginBottom: 8,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
  },
  delegationDetails: {
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

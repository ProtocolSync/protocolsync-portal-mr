import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { AppFooter } from '../components/common/AppFooter';
import { DocumentQueryModal } from '../components/common/DocumentQueryModal';
import { delegationService } from '../services/apiClient';
import designTokens from '../design-tokens.json';

interface Delegation {
  delegation_id: number;
  protocol_version_id: number;
  document_master_id?: number;
  protocol_name: string;
  version_number?: string;
  protocol_version?: string;
  trial_role_name?: string;
  delegated_job_title?: string;
  delegation_date: string;
  effective_start_date: string;
  status: string;
}

export const MyProtocolsScreen = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDelegations();
    }
  }, [user?.id]);

  const fetchDelegations = async () => {
    try {
      // Use user_id (numeric) if available, otherwise fall back to id (string)
      const userId = user?.user_id ? String(user.user_id) : user!.id;
      console.log('🔄 Fetching delegations for user:', userId);
      
      const response = await delegationService.getDelegations(userId);

      console.log('✅ Delegations fetched:', response);
      
      if (response.success && response.data) {
        // Debug: log delegation ownership
        response.data.forEach((d: any) => {
          console.log(`Delegation ${d.delegation_id}: delegated_user_id=${d.delegated_user_id}, current_user=${userId}`);
        });
        setDelegations(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load delegations');
        setDelegations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching delegations:', error);
      Alert.alert('Error', 'Failed to load delegations');
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

  const handleAcceptDecline = async (delegationId: number, action: 'accept' | 'decline') => {
    if (!user?.id) return;

    try {
      setActionLoading(delegationId);

      const printedName = user.displayName || user.name || 'User';
      // Use user_id (numeric) if available, otherwise fall back to id (string)
      const userId = user.user_id ? String(user.user_id) : user.id;
      const response = await delegationService.signDelegation(
        delegationId,
        userId,
        action,
        printedName
      );

      if (response.success) {
        Alert.alert('Success', `Delegation ${action}ed successfully`);
        // Refresh the list
        await fetchDelegations();
      } else {
        Alert.alert('Error', response.error || `Failed to ${action} delegation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing delegation:`, error);
      Alert.alert('Error', `Failed to ${action} delegation`);
    } finally {
      setActionLoading(null);
    }
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
        <Text style={styles.loadingText}>Loading protocols...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>My Delegated Protocols</Text>
            <Text style={styles.pageSubtitle}>Protocols you have been delegated to work on</Text>
          </View>
        </View>
      </View>

      {/* Delegations List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {delegations.length > 0 ? (
          <View>
            {/* Delegation Cards */}
            <View style={styles.delegationsContainer}>
              {delegations.map((delegation) => (
                <View key={delegation.delegation_id} style={styles.delegationCard}>
                  <View style={styles.delegationHeader}>
                    <View style={styles.delegationTitleContainer}>
                      <Text style={styles.delegationName}>{delegation.protocol_name}</Text>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>
                          v{delegation.version_number || delegation.protocol_version || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.delegationActions}>
                      {delegation.status === 'pending' && (
                        <>
                          <IconButton
                            icon="check-circle"
                            size={20}
                            iconColor="#10B981"
                            onPress={() => handleAcceptDecline(delegation.delegation_id, 'accept')}
                            disabled={actionLoading === delegation.delegation_id}
                            style={styles.iconButton}
                          />
                          <IconButton
                            icon="close-circle"
                            size={20}
                            iconColor="#EF4444"
                            onPress={() => handleAcceptDecline(delegation.delegation_id, 'decline')}
                            disabled={actionLoading === delegation.delegation_id}
                            style={styles.iconButton}
                          />
                        </>
                      )}
                      <IconButton
                        icon="comment-question"
                        size={20}
                        iconColor="#3B82F6"
                        onPress={() => {
                          setSelectedDelegation(delegation);
                          setShowQueryModal(true);
                        }}
                        style={styles.iconButton}
                      />
                    </View>
                  </View>

                  <View style={styles.delegationDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>YOUR ROLE</Text>
                      <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
                        <Text style={styles.badgeText}>
                          {delegation.delegated_job_title || delegation.trial_role_name || 'Not Specified'}
                        </Text>
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
                      <Text style={styles.detailLabel}>DELEGATED DATE</Text>
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
      </ScrollView>
      <AppFooter />

      {/* Document Query Modal */}
      {selectedDelegation && (
        <DocumentQueryModal
          visible={showQueryModal}
          onClose={() => {
            setShowQueryModal(false);
            setSelectedDelegation(null);
          }}
          documentId={String(selectedDelegation.protocol_version_id)}
          documentName={selectedDelegation.protocol_name}
          documentVersion={selectedDelegation.version_number || selectedDelegation.protocol_version}
        />
      )}
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
  pageHeader: {
    backgroundColor: '#FFFFFF',
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  headerContent: {
    flexDirection: 'column',
    gap: designTokens.spacing.m,
  },
  headerTextContainer: {
    flex: 1,
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
  delegationsContainer: {
    gap: 16,
  },
  delegationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  delegationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  delegationTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  delegationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A52',
    marginBottom: 8,
  },
  delegationActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
    padding: 0,
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
    marginBottom: 16,
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
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
});

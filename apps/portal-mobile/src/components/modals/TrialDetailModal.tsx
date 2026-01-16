import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { trialsService } from '../../services/apiClient';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface TrialDetailModalProps {
  trialId: number;
  onClose: () => void;
}

interface Trial {
  trial_id: number;
  trial_number: string;
  trial_name: string;
  protocol_number?: string;
  sponsor_name?: string;
  phase?: string;
  therapeutic_area?: string;
  indication?: string;
  study_type?: string;
  status: string;
  pi_name?: string;
  site_name: string;
  site_number: string;
  assigned_user_count: number;
  document_count: number;
  created_at: string;
  record_hash?: string;
}

export const TrialDetailModal = ({ trialId, onClose }: TrialDetailModalProps) => {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialDetails();
  }, [trialId]);

  const fetchTrialDetails = async () => {
    try {
      setLoading(true);

      const response = await trialsService.getTrial(trialId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch trial details');
      }

      if (response.data) {
        setTrial(response.data as Trial);
      }
    } catch (error) {
      console.error('Error fetching trial details:', error);
      Alert.alert('Error', 'Failed to load trial details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Trial Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
            <Text style={styles.loadingText}>Loading trial details...</Text>
          </View>
        ) : trial ? (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Trial Name & Badges */}
            <View style={styles.section}>
              <Text style={styles.trialName}>{trial.trial_name}</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(trial.status) }]}>
                  <Text style={styles.badgeText}>{trial.status}</Text>
                </View>
                {trial.phase && (
                  <View style={[styles.badge, { backgroundColor: getPhaseColor(trial.phase) }]}>
                    <Text style={styles.badgeText}>{trial.phase}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Trial Information */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trial Number</Text>
                <Text style={styles.infoValue}>{trial.trial_number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Protocol Number</Text>
                <Text style={styles.infoValue}>{trial.protocol_number || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Site</Text>
                <Text style={styles.infoValue}>
                  {trial.site_number} - {trial.site_name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Principal Investigator</Text>
                <Text style={styles.infoValue}>{trial.pi_name || 'Not assigned'}</Text>
              </View>
            </View>

            {/* Study Details */}
            {(trial.sponsor_name || trial.therapeutic_area || trial.study_type) && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Study Details</Text>
                  {trial.sponsor_name && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Sponsor</Text>
                      <Text style={styles.infoValue}>{trial.sponsor_name}</Text>
                    </View>
                  )}
                  {trial.therapeutic_area && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Therapeutic Area</Text>
                      <Text style={styles.infoValue}>{trial.therapeutic_area}</Text>
                    </View>
                  )}
                  {trial.indication && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Indication</Text>
                      <Text style={styles.infoValue}>{trial.indication}</Text>
                    </View>
                  )}
                  {trial.study_type && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Study Type</Text>
                      <Text style={styles.infoValue}>{trial.study_type}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Trial Summary */}
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trial Summary</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Team Members</Text>
                <View style={styles.membersBadge}>
                  <Text style={styles.membersBadgeText}>
                    {trial.assigned_user_count} {trial.assigned_user_count === 1 ? 'member' : 'members'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Documents</Text>
                <Text style={styles.infoValue}>{trial.document_count || 0} documents</Text>
              </View>
            </View>

            {/* Metadata */}
            <View style={styles.divider} />
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDate(trial.created_at)}</Text>
              </View>
            </View>

            {/* Record Hash */}
            {trial.record_hash && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.infoLabel}>Record Hash (21 CFR Part 11)</Text>
                  <View style={styles.hashContainer}>
                    <Text style={styles.hashText}>{trial.record_hash}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Trial not found</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButtonFooter} onPress={onClose}>
            <Text style={styles.closeButtonFooterText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as any,
    color: '#1E3A52',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  trialName: {
    fontSize: 20,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: '#FFFFFF',
    textTransform: 'capitalize' as any,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#1E3A52',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: '#6B7280',
    textTransform: 'uppercase' as any,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E3A52',
    flex: 1,
    textAlign: 'right' as any,
  },
  membersBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E0E7FF',
  },
  membersBadgeText: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: '#3730A3',
  },
  hashContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  hashText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButtonFooter: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#6B7280',
    alignItems: 'center',
  },
  closeButtonFooterText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#FFFFFF',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { trialsService } from '../services/apiClient';
import { AppFooter } from '../components/common/AppFooter';
import { AddTrialModal } from '../components/modals/AddTrialModal';
import { TrialDetailModal } from '../components/modals/TrialDetailModal';
import designTokens from '../design-tokens.json';
import type { Trial } from '@protocolsync/shared-services';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type TrialsScreenProps = DrawerScreenProps<DrawerParamList, 'Trials'>;

export const TrialsScreen = ({ navigation }: TrialsScreenProps) => {
  const { user } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null);

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

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchTrials();
  };

  const handleExportCSV = async () => {
    try {
      console.log('[Export] Starting CSV export for trials');
      console.log('[Export] Platform:', Platform.OS);

      // Generate CSV content
      const headers = ['Trial Number', 'Trial Name', 'Protocol', 'Phase', 'Status', 'PI', 'Team Members'];
      const rows = trials.map(trial => [
        trial.trial_number,
        trial.trial_name,
        trial.protocol_number || '',
        trial.phase || '',
        trial.status,
        trial.pi_name || '',
        trial.assigned_user_count.toString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      console.log('[Export] CSV content created, length:', csvContent.length);

      const fileName = `trials_${new Date().toISOString().split('T')[0]}.csv`;

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
        Alert.alert('Error', 'File system not available');
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
          dialogTitle: 'Export Trials',
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
        <Text style={styles.loadingText}>Loading trials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.pageTitle}>Clinical Trials</Text>
          <Text style={styles.pageSubtitle}>Manage clinical trials at your site</Text>
        </View>
        <View style={styles.headerActions}>
          {trials.length > 0 && (
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
            <Text style={styles.createButtonText}>+ Create Trial</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Trials List */}
        {trials.length > 0 ? (
          <>
            {trials.map((trial) => (
              <View key={trial.trial_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.trialNumber}>{trial.trial_number}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(trial.status) }]}>
                      <Text style={styles.badgeText}>{trial.status}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.trialName}>{trial.trial_name}</Text>

                <View style={styles.trialDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PROTOCOL</Text>
                    <Text style={styles.detailValue}>{trial.protocol_number || '-'}</Text>
                  </View>

                  {trial.phase && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>PHASE</Text>
                      <View style={[styles.badge, { backgroundColor: getPhaseColor(trial.phase) }]}>
                        <Text style={styles.badgeText}>{trial.phase}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PRINCIPAL INVESTIGATOR</Text>
                    <Text style={styles.detailValue}>
                      {trial.pi_name || <Text style={styles.detailValueItalic}>Not assigned</Text>}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>TEAM</Text>
                    <View style={styles.membersBadge}>
                      <Text style={styles.membersBadgeText}>
                        {trial.assigned_user_count} {trial.assigned_user_count === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <IconButton
                    icon="eye"
                    size={20}
                    iconColor={designTokens.color.accent.green600}
                    onPress={() => setSelectedTrialId(trial.trial_id)}
                  />
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔬</Text>
            <Text style={styles.emptyStateTitle}>No Trials yet.</Text>
            <Text style={styles.emptyStateText}>
              Get started by creating your first clinical trial. Trials represent specific research studies conducted at your site.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>+ Create Your First Trial</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <AppFooter />

      {/* Modals */}
      <AddTrialModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedTrialId && (
        <TrialDetailModal
          trialId={selectedTrialId}
          onClose={() => setSelectedTrialId(null)}
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
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
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
  trialNumber: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.accent.green600,
  },
  trialName: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.xs,
  },
  trialDetails: {
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
    fontSize: 11,
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

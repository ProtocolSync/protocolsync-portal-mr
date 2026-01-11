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
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { api, delegationService } from '../services/apiClient';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '../design-tokens.json';
import { IconButton } from 'react-native-paper';
import { DelegationDetailsModal } from '../components/modals/DelegationDetailsModal';
import { DelegationReportModal } from '../components/modals/DelegationReportModal';
import { AssignDelegationModal } from '../components/modals/AssignDelegationModal';
import { RevokeDelegationModal } from '../components/modals/RevokeDelegationModal';
import type { DelegationReportConfig, CreateDelegationData } from '@protocolsync/shared-services';

interface Delegation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  protocolVersionId: string;
  protocolName: string;
  protocolVersion?: string;
  jobTitle: string;
  delegationDate: string;
  delegatedBy: string;
  delegatedByName: string;
  signatureDate?: string;
  signatureIp?: string;
  status: 'pending' | 'signed' | 'revoked';
  createdAt: string;
  recordHash?: string;
}

export const DelegationLogScreen = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [revokingDelegation, setRevokingDelegation] = useState<Delegation | null>(null);
  const [protocolVersions, setProtocolVersions] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchDelegations();
    fetchProtocolVersions();
    if (user) fetchSiteUsers();
  }, [user]);

  const fetchProtocolVersions = async () => {
    try {
      const response = await api.get('/compliance/protocol-versions');
      if (response.success && response.data) {
        const versions = (response.data as any).data || response.data;
        setProtocolVersions(versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch protocol versions:', error);
    }
  };

  const fetchSiteUsers = async () => {
    try {
      const siteId = (user as any)?.site?.id;
      if (!siteId) return;

      const response = await api.get(`/sites/${siteId}/users`);
      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : ((response.data as any).data || []);
        setSiteUsers(users || []);
      }
    } catch (error) {
      console.error('Failed to fetch site users:', error);
    }
  };

  const fetchDelegations = async () => {
    try {
      console.log('🔄 Fetching delegations...');
      
      const response = await api.get('/compliance/delegations');

      console.log('✅ Delegations fetched:', response);

      if (response.success && response.data) {
        const rawDelegations = (response.data as any).data || (response.data as any).delegations || response.data;
        
        const transformedDelegations = rawDelegations.map((d: any) => ({
          id: d.id || d.delegation_id,
          userId: d.user_id || d.userId,
          userName: d.user_name || d.userName || d.delegated_user_name || 'Unknown',
          userEmail: d.user_email || d.userEmail || d.delegated_user_email || '',
          protocolVersionId: d.protocol_version_id || d.protocolVersionId || '',
          protocolName: d.protocol_name || 'Unknown Protocol',
          protocolVersion: d.protocol_version,
          jobTitle: d.delegated_job_title || d.user_current_job_title || 'Not Specified',
          delegationDate: d.delegation_date || d.delegationDate || d.created_at || '',
          delegatedBy: d.delegated_by || d.delegatedBy || '',
          delegatedByName: d.delegated_by_name || d.delegatedByName || d.delegator_name || 'Unknown',
          signatureDate: d.signature_date || d.signatureDate,
          signatureIp: d.signature_ip || d.signatureIp,
          status: (d.status || 'pending').toLowerCase() === 'accepted' ? 'signed' : ((d.status || 'pending').toLowerCase() as 'pending' | 'signed' | 'revoked'),
          createdAt: d.created_at || d.createdAt || '',
          recordHash: d.record_hash || d.recordHash,
        }));

        setDelegations(transformedDelegations);
      } else {
        setDelegations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching delegations:', error);
      Alert.alert('Error', 'Failed to load delegation log');
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

  const handleSign = async (delegationId: string) => {
    try {
      const response = await api.post(`/compliance/delegation/${delegationId}/sign`, {
        signature_ip: '0.0.0.0', // Mobile app - IP not available
      });

      if (response.success) {
        Alert.alert('Success', 'Delegation signed successfully');
        fetchDelegations();
      } else {
        Alert.alert('Error', response.error || 'Failed to sign delegation');
      }
    } catch (error) {
      console.error('Error signing delegation:', error);
      Alert.alert('Error', 'Failed to sign delegation');
    }
  };

  const handleView = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setDetailsModalVisible(true);
  };

  const handleRevoke = (delegation: Delegation) => {
    setRevokingDelegation(delegation);
    setRevokeModalVisible(true);
  };

  const handleRevokeConfirm = async () => {
    if (!revokingDelegation) return;

    try {
      const userId = user?.id || (user as any)?.user_id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await delegationService.revokeDelegation(
        revokingDelegation.id,
        String(userId),
        'Revoked by authorized personnel'
      );

      if (response.success) {
        Alert.alert('Success', 'Delegation revoked successfully');
        fetchDelegations();
        setRevokeModalVisible(false);
        setRevokingDelegation(null);
      } else {
        throw new Error(response.error || 'Failed to revoke delegation');
      }
    } catch (error) {
      console.error('[DelegationLogScreen] Error revoking delegation:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to revoke delegation');
    }
  };

  const handleAssignTask = () => {
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (data: CreateDelegationData) => {
    try {
      // Set the delegated_by_user_id from current user
      const userId = user?.id || (user as any)?.user_id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const delegationData = {
        ...data,
        delegated_by_user_id: String(userId),
      };

      const response = await delegationService.createDelegation(delegationData);

      if (response.success) {
        Alert.alert('Success', 'Delegation created successfully');
        fetchDelegations();
        setAssignModalVisible(false);
      } else {
        throw new Error(response.error || 'Failed to create delegation');
      }
    } catch (error) {
      console.error('[DelegationLogScreen] Error creating delegation:', error);
      throw error;
    }
  };

  const handleGenerateReport = () => {
    setReportModalVisible(true);
  };

  const downloadReport = async (reportId: string, reportTitle: string) => {
    try {
      console.log('[DelegationLog] Starting download for report:', reportId);

      const downloadUrl = `${ENV.API_URL}/reports/download/${reportId}`;
      const filename = (reportTitle || `Report-${reportId}`).trim().replace(/[^a-zA-Z0-9-_\.]/g, '_') + '.pdf';

      console.log('[DelegationLog] Download URL:', downloadUrl);
      console.log('[DelegationLog] Filename:', filename);

      if (Platform.OS === 'web') {
        // Web: Fetch and trigger download
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': ENV.API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('[DelegationLog] Web download completed');
      } else {
        // Native: Download and share
        const token = await AsyncStorage.getItem('access_token');
        const localUri = `${FileSystem.documentDirectory}${filename}`;

        console.log('[DelegationLog] Downloading to:', localUri);

        await FileSystem.downloadAsync(downloadUrl, localUri, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': ENV.API_KEY,
          },
        });

        console.log('[DelegationLog] Download complete, checking sharing availability');

        const sharingAvailable = await Sharing.isAvailableAsync();
        if (sharingAvailable) {
          await Sharing.shareAsync(localUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Report',
          });
          console.log('[DelegationLog] Share dialog shown');
        } else {
          console.log('[DelegationLog] Sharing not available');
        }
      }

      Alert.alert('Success', 'Report generated and downloaded successfully!');
    } catch (error) {
      console.error('[DelegationLog] Download error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to download report');
    }
  };

  const handleReportGenerate = async (config: DelegationReportConfig) => {
    try {
      if (!user?.user_id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      Alert.alert('Generating Report', 'Your report is being generated. This may take a few moments...');

      // Generate report
      const response = await delegationService.generateReport(
        String(user.user_id),
        config
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to start report generation');
      }

      const reportId = response.data.report_id;

      // Poll for completion
      const pollResult = await delegationService.pollReportStatus(
        reportId,
        (status) => {
          console.log('[DelegationLog] Report status:', status.status);
        },
        30,
        1000
      );

      if (pollResult.success && pollResult.data) {
        // pollResult.data is the reportId
        const reportId = pollResult.data;
        
        console.log('[DelegationLog] Report completed, downloading:', reportId);
        
        // Download report with authentication
        await downloadReport(reportId, config.reportTitle);
      } else {
        throw new Error(pollResult.error || 'Report generation failed');
      }
    } catch (error) {
      console.error('[DelegationLog] Error generating report:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate report'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'revoked':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const canDelegate = ['admin', 'site_admin', 'site_user'].includes(user?.role || '');
  const myPendingDelegations = delegations.filter(d => d.userId === String(user?.user_id || '') && d.status === 'pending');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
        <Text style={styles.loadingText}>Loading delegation log...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>Delegation of Authority Log</Text>
            <Text style={styles.pageSubtitle}>Electronic DOA Log - FDA 21 CFR Part 11 Compliant</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon="file-document"
              size={24}
              iconColor={designTokens.color.accent.green600}
              onPress={handleGenerateReport}
            />
            {canDelegate && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleAssignTask}
              >
                <Text style={styles.createButtonText}>✓ Assign Task</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Pending Delegations Alert */}
        {myPendingDelegations.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠️ Action Required</Text>
            <Text style={styles.alertText}>
              You have {myPendingDelegations.length} pending {myPendingDelegations.length === 1 ? 'delegation' : 'delegations'} requiring your signature.
            </Text>
          </View>
        )}

        {/* Delegations List */}
        {delegations.length > 0 ? (
          <View style={styles.delegationsContainer}>
            {delegations.map((delegation) => (
              <View key={delegation.id} style={styles.delegationCard}>
                <View style={styles.delegationHeader}>
                  <View style={styles.delegationTitleContainer}>
                    <Text style={styles.delegationUserName}>{delegation.userName}</Text>
                    <Text style={styles.delegationUserEmail}>{delegation.userEmail}</Text>
                  </View>
                  <View style={styles.delegationActions}>
                    {delegation.userId === String(user?.user_id || '') && delegation.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.signButton}
                        onPress={() => handleSign(delegation.id)}
                      >
                        <Text style={styles.signButtonText}>Sign</Text>
                      </TouchableOpacity>
                    )}
                    <IconButton
                      icon="eye"
                      size={20}
                      iconColor="#6B7280"
                      onPress={() => handleView(delegation)}
                      style={styles.iconButton}
                    />
                    {delegation.status !== 'revoked' && canDelegate && (
                      <IconButton
                        icon="close-circle"
                        size={20}
                        iconColor="#EF4444"
                        onPress={() => handleRevoke(delegation)}
                        style={styles.iconButton}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.delegationDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>JOB TITLE</Text>
                    <Text style={styles.detailValue}>{delegation.jobTitle}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PROTOCOL</Text>
                    <View style={styles.protocolInfo}>
                      <Text style={styles.detailValue}>{delegation.protocolName}</Text>
                      {delegation.protocolVersion && (
                        <View style={styles.versionBadge}>
                          <Text style={styles.versionBadgeText}>{delegation.protocolVersion}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>DELEGATED BY</Text>
                    <Text style={styles.detailValue}>{delegation.delegatedByName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>DELEGATION DATE</Text>
                    <Text style={styles.detailValue}>
                      {new Date(delegation.delegationDate).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>STATUS</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delegation.status) }]}>
                      <Text style={styles.statusBadgeText}>
                        {delegation.status === 'signed' && '✓ '}
                        {delegation.status.charAt(0).toUpperCase() + delegation.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✍️</Text>
            <Text style={styles.emptyStateText}>No Delegations Found</Text>
            <Text style={styles.emptyStateSubtext}>
              Delegation records will appear here once tasks are assigned
            </Text>
            {canDelegate && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAssignTask}
              >
                <Text style={styles.emptyStateButtonText}>Assign First Task</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      <AppFooter />

      {/* Delegation Details Modal */}
      <DelegationDetailsModal
        visible={detailsModalVisible}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedDelegation(null);
        }}
        delegation={selectedDelegation}
      />

      {/* Delegation Report Modal */}
      <DelegationReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onGenerate={handleReportGenerate}
        protocolVersions={protocolVersions}
        siteUsers={siteUsers}
      />

      {/* Assign Delegation Modal */}
      <AssignDelegationModal
        visible={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        onSubmit={handleAssignSubmit}
        protocolVersions={protocolVersions}
        siteUsers={siteUsers}
      />

      {/* Revoke Delegation Modal */}
      <RevokeDelegationModal
        visible={revokeModalVisible}
        onClose={() => {
          setRevokeModalVisible(false);
          setRevokingDelegation(null);
        }}
        onConfirm={handleRevokeConfirm}
        delegation={revokingDelegation}
      />
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
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.color.background.page,
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
    fontWeight: '600',
  },
  alertBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
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
  delegationUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A52',
    marginBottom: 4,
  },
  delegationUserEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  delegationActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  signButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  signButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconButton: {
    margin: 0,
    padding: 0,
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
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E3A52',
    textAlign: 'right',
    flex: 1,
  },
  protocolInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  versionBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

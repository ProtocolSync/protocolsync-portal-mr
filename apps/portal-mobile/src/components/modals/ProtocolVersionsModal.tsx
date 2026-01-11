import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import designTokens from '../../design-tokens.json';
import { useAuth } from '../../contexts/AuthContext';
import { protocolDocumentsService } from '../../services/apiClient';
import { ProtocolVersion } from '@protocolsync/shared-services';

interface ProtocolVersionsModalProps {
  visible: boolean;
  onClose: () => void;
  document: {
    id: string;
    documentName: string;
    document_type?: string;
    original_filename?: string;
  };
  onRefreshParent?: () => void;
}

export const ProtocolVersionsModal: React.FC<ProtocolVersionsModalProps> = ({
  visible,
  onClose,
  document,
  onRefreshParent,
}) => {
  const { getToken } = useAuth();
  const [versions, setVersions] = useState<ProtocolVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && document) {
      fetchVersions();
    }
  }, [visible, document]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      console.log('[ProtocolVersionsModal] Fetching versions for document:', document.id);
      
      // Use the service method which properly handles API key and authentication
      const response = await protocolDocumentsService.getProtocolVersions(document.id);

      console.log('[ProtocolVersionsModal] Versions response:', response);

      if (response.success && response.data) {
        console.log('[ProtocolVersionsModal] Setting versions:', response.data.length);
        setVersions(response.data);
      } else {
        console.warn('[ProtocolVersionsModal] Failed to fetch versions:', response.error);
        Alert.alert('Error', response.error || 'Failed to load document versions');
        setVersions([]);
      }
    } catch (error) {
      console.error('[ProtocolVersionsModal] Error fetching versions:', error);
      Alert.alert('Error', 'Failed to load document versions');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrent = async (versionId: string) => {
    try {
      console.log('[ProtocolVersionsModal] Setting version to current:', versionId);
      
      // Use the service method which properly handles API key and authentication
      const response = await protocolDocumentsService.updateVersionStatus(versionId, 'Current');

      if (response.success) {
        Alert.alert('Success', 'Version set to Current successfully');
        // Refresh versions list
        await fetchVersions();
        // Refresh parent screen's document list
        if (onRefreshParent) {
          onRefreshParent();
        }
      } else {
        console.warn('[ProtocolVersionsModal] Failed to update status:', response.error);
        Alert.alert('Error', response.error || 'Failed to update version status');
      }
    } catch (error) {
      console.error('[ProtocolVersionsModal] Error setting current:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update version status');
    }
  };

  const handleQuery = (version: ProtocolVersion) => {
    // TODO: Implement Query functionality with ChatWidget
    Alert.alert('Info', `Query functionality for version ${version.versionNumber} - Coming soon`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'current':
        return '#10B981';
      case 'uploaded':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {document.documentName}
            </Text>
            <Text style={styles.headerSubtitle}>Version History</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
            <Text style={styles.loadingText}>Loading versions...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {versions.length > 0 ? (
              versions.map((version) => {
                const isCurrent = version.status.toLowerCase() === 'current';
                return (
                  <View key={version.id} style={styles.versionCard}>
                    {/* Version Header */}
                    <View style={styles.versionHeader}>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionBadgeText}>{version.versionNumber}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(version.status) }]}>
                        <Text style={styles.statusBadgeText}>
                          {isCurrent && '✓ '}
                          {version.status}
                        </Text>
                      </View>
                    </View>

                    {/* Version Details */}
                    <View style={styles.versionDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Uploaded At</Text>
                        <Text style={styles.detailValue}>{formatDate(version.uploadedAt)}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Uploaded By</Text>
                        <Text style={styles.detailValue}>{version.uploadedBy}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>File Name</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>{version.fileName}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Record Hash</Text>
                        <Text style={styles.detailValueHash} numberOfLines={2}>
                          {version.recordHash || 'Not available'}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.versionActions}>
                      {isCurrent ? (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.queryButton]}
                          onPress={() => handleQuery(version)}
                        >
                          <IconButton
                            icon="message-text"
                            size={20}
                            iconColor="#FFFFFF"
                            style={styles.actionIcon}
                          />
                          <Text style={styles.actionButtonText}>Query</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.setCurrentButton]}
                          onPress={() => handleSetCurrent(version.id)}
                        >
                          <IconButton
                            icon="check-circle"
                            size={20}
                            iconColor="#FFFFFF"
                            style={styles.actionIcon}
                          />
                          <Text style={styles.actionButtonText}>Set to Current</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📄</Text>
                <Text style={styles.emptyStateText}>No versions found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.m,
    paddingVertical: designTokens.spacing.m,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  headerLeft: {
    width: 80,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 80,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: designTokens.color.accent.green600,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: designTokens.color.text.heading,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
    marginTop: 2,
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
    padding: designTokens.spacing.m,
  },
  versionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.m,
    paddingBottom: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  versionBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  versionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  versionDetails: {
    gap: 12,
    marginBottom: designTokens.spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    textTransform: 'uppercase',
    flex: 0,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 14,
    color: designTokens.color.text.body,
    flex: 1,
    textAlign: 'right',
  },
  detailValueHash: {
    fontSize: 10,
    color: designTokens.color.text.subtle,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  versionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: designTokens.spacing.s,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  queryButton: {
    backgroundColor: '#3B82F6',
  },
  setCurrentButton: {
    backgroundColor: designTokens.color.accent.green500,
  },
  actionIcon: {
    margin: 0,
    padding: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: designTokens.color.text.subtle,
  },
});

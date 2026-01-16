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
import { IconButton } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { protocolDocumentsService } from '../services/apiClient';
import { AppFooter } from '../components/common/AppFooter';
import { ProtocolUploadModal } from '../components/modals/ProtocolUploadModal';
import { ProtocolVersionsModal } from '../components/modals/ProtocolVersionsModal';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface ProtocolDocument {
  id: string;
  document_id?: string;
  documentName: string;
  currentVersion: string;
  totalVersions: number;
  status: string;
  document_type?: string;
  original_filename?: string;
  document_version?: string;
  upload_date?: string;
  created_at?: string;
}

export const ProtocolVersionsScreen = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ProtocolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [versionsModalVisible, setVersionsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProtocolDocument | null>(null);

  useEffect(() => {
    fetchProtocolDocuments();
  }, []);

  const fetchProtocolDocuments = async () => {
    try {
      console.log('🔄 Fetching protocol documents...');
      console.log('👤 Current user:', user);
      console.log('👤 User site ID:', user?.site?.id);
      console.log('👤 User role:', user?.role);
      
      // For Trial Lead role, filter by site_id (and optionally trial_id if we had a selected trial)
      const siteId = user?.site?.id;
      
      // Call the service with optional filters
      const response = await protocolDocumentsService.getProtocolDocuments(siteId);

      console.log('✅ Protocol documents response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data:', response.data);
      console.log('📊 Response error:', response.error);

      if (response.success && response.data) {
        console.log('✅ Setting documents:', response.data.length, 'documents');
        setDocuments(response.data);
      } else {
        console.warn('⚠️ No data in response or request failed');
        setDocuments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching protocol documents:', error);
      Alert.alert('Error', 'Failed to load protocol documents');
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProtocolDocuments();
  };

  const handleView = (document: ProtocolDocument) => {
    setSelectedDocument(document);
    setVersionsModalVisible(true);
  };

  const handleUpload = () => {
    setUploadModalVisible(true);
  };

  const handleUploadSuccess = () => {
    // Refresh the protocol documents list
    fetchProtocolDocuments();
  };

  const handleExportCSV = async () => {
    try {
      console.log('[Export] Starting CSV export for protocol documents');
      console.log('[Export] Platform:', Platform.OS);

      // Generate CSV content
      const headers = ['Document Name', 'Current Version', 'Total Versions', 'Status'];
      const rows = documents.map(doc => [
        doc.documentName,
        doc.currentVersion,
        doc.totalVersions.toString(),
        doc.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      console.log('[Export] CSV content created, length:', csvContent.length);

      const fileName = `protocol_documents_${new Date().toISOString().split('T')[0]}.csv`;

      // Check if we're on web
      if (Platform.OS === 'web') {
        console.log('[Export] Using web download method');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Alert.alert('Success', 'CSV exported successfully');
        return;
      }

      // Native platform (iOS/Android)
      console.log('[Export] Using native file system method');

      // Check if cache directory is available
      if (!FileSystem.cacheDirectory) {
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
        console.log('[Export] Opening share dialog');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Protocol Documents CSV',
        });
        console.log('[Export] Share dialog closed');
      } else {
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
      case 'current':
        return '#10B981';
      case 'uploaded':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.color.accent.green500} />
        <Text style={styles.loadingText}>Loading protocol versions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>Protocol Versions</Text>
            <Text style={styles.pageSubtitle}>Manage and track all protocol document versions</Text>
          </View>
          <View style={styles.headerActions}>
            {documents.length > 0 && (
              <IconButton
                icon="download"
                size={24}
                iconColor={designTokens.color.accent.green600}
                onPress={handleExportCSV}
              />
            )}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleUpload}
            >
              <Text style={styles.createButtonText}>📤 Upload New Protocol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Documents List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {documents.length > 0 ? (
          <View style={styles.documentsContainer}>
            {documents.map((doc) => (
              <View key={doc.id} style={styles.card}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentTitleContainer}>
                    <Text style={styles.documentName}>{doc.documentName}</Text>
                    <View style={styles.versionBadge}>
                      <Text style={styles.versionBadgeText}>{doc.currentVersion}</Text>
                    </View>
                  </View>
                  <IconButton
                    icon="eye"
                    size={20}
                    iconColor={designTokens.color.accent.green600}
                    onPress={() => handleView(doc)}
                  />
                </View>

                <View style={styles.documentDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>TOTAL VERSIONS</Text>
                    {doc.totalVersions > 0 ? (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{doc.totalVersions}</Text>
                      </View>
                    ) : (
                      <Text style={styles.detailValue}>—</Text>
                    )}
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>STATUS</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) }]}>
                      <Text style={styles.statusBadgeText}>{doc.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📄</Text>
            <Text style={styles.emptyStateTitle}>No Protocol Documents yet.</Text>
            <Text style={styles.emptyStateText}>
              Get started by uploading your first protocol document. Protocol documents represent the official study protocols and their versions.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleUpload}
            >
              <Text style={styles.emptyStateButtonText}>📤 Upload Your First Protocol</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <AppFooter />

      {/* Upload Modal */}
      <ProtocolUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Versions Modal */}
      {selectedDocument && (
        <ProtocolVersionsModal
          visible={versionsModalVisible}
          onClose={() => {
            setVersionsModalVisible(false);
            setSelectedDocument(null);
          }}
          document={{
            id: selectedDocument.id,
            documentName: selectedDocument.documentName,
            document_type: selectedDocument.document_type,
            original_filename: selectedDocument.original_filename,
          }}
          onRefreshParent={fetchProtocolDocuments}
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
    fontWeight: '600' as any,
  },
  listContainer: {
    padding: designTokens.spacing.m,
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
  documentsContainer: {
    gap: designTokens.spacing.m,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  documentTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  documentName: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.xs,
  },
  versionBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  documentDetails: {
    gap: 12,
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
  countBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  countBadgeText: {
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
    textTransform: 'capitalize' as any,
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

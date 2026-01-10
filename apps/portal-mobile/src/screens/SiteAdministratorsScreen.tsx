import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform } from 'react-native';
import { Button, Chip, Portal, Modal, Avatar, IconButton, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { api, sitesService } from '../services/apiClient';
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
  created_at?: string;
  record_hash?: string;
}

interface Site {
  site_id: number;
  site_number: string;
  site_name: string;
}

interface AddAdminFormData {
  email: string;
  full_name: string;
  job_title: string;
  site_id: number | null;
}

export const SiteAdministratorsScreen = () => {
  const { user } = useAuth();
  const [administrators, setAdministrators] = useState<SiteAdministrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<SiteAdministrator | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [formData, setFormData] = useState<AddAdminFormData>({
    email: '',
    full_name: '',
    job_title: '',
    site_id: null
  });
  const [submitting, setSubmitting] = useState(false);

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

      console.log('[SiteAdministratorsScreen] Fetching administrators for company:', companyId);
      const response = await sitesService.getSiteAdministrators(companyId);
      console.log('[SiteAdministratorsScreen] Response:', response);

      if (response.success && response.data !== undefined) {
        console.log('[SiteAdministratorsScreen] Setting administrators:', response.data);
        setAdministrators(response.data);
      } else {
        console.error('[SiteAdministratorsScreen] Failed to load:', response.error);
        setError(response.error || 'Failed to load administrators');
      }
    } catch (err) {
      console.error('[SiteAdministratorsScreen] Error caught:', err);
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

  const handleExportCSV = async () => {
    try {
      console.log('[Export] Starting CSV export for administrators');
      console.log('[Export] Platform:', Platform.OS);

      // Convert administrators to CSV format
      const headers = ['Name', 'Email', 'Job Title', 'Role', 'Site', 'Status', 'Created At'];
      const csvData = administrators.map(admin => [
        admin.name,
        admin.email,
        admin.job_title || '',
        admin.role || 'Site Admin',
        `${admin.site_number} - ${admin.site_name}`,
        admin.status,
        admin.created_at ? new Date(admin.created_at).toLocaleDateString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      console.log('[Export] CSV content created, length:', csvContent.length);

      const fileName = `site_administrators_${new Date().toISOString().split('T')[0]}.csv`;

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
        setError('File system not available');
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
          dialogTitle: 'Export Site Administrators',
          UTI: 'public.comma-separated-values-text',
        });
        console.log('[Export] Share completed');
      } else {
        console.error('[Export] Sharing not available');
        setError('Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('[Export] Error exporting CSV:', error);
      console.error('[Export] Error message:', error.message);
      console.error('[Export] Error stack:', error.stack);
      setError(`Failed to export CSV: ${error.message || 'Unknown error'}`);
    }
  };

  const fetchSites = useCallback(async () => {
    const companyId = user?.company?.id;
    if (!companyId) return;

    setLoadingSites(true);
    try {
      const response = await api.get<{ data: Site[] }>(`/companies/${companyId}/sites`);
      if (response.success && response.data !== undefined) {
        const sitesData = response.data.data !== undefined ? response.data.data : response.data;
        setSites(Array.isArray(sitesData) ? sitesData : []);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    } finally {
      setLoadingSites(false);
    }
  }, [user]);

  const handleOpenAddModal = () => {
    setFormData({
      email: '',
      full_name: '',
      job_title: '',
      site_id: null
    });
    setError(null);
    setShowAddModal(true);
    fetchSites();
  };

  const handleSubmitAddAdmin = async () => {
    // Validation
    if (!formData.email || !formData.full_name || !formData.job_title || !formData.site_id) {
      setError('All fields are required');
      return;
    }

    const companyId = user?.company?.id;
    const userId = user?.id;
    if (!companyId || !userId) {
      setError('Company information not available');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Split full name into first and last name
      const nameParts = formData.full_name.trim().split(' ');
      const firstName = nameParts[0] || formData.full_name;
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await sitesService.addSiteAdministrator(companyId, formData.site_id, {
        admin_email: formData.email,
        admin_first_name: firstName,
        admin_last_name: lastName,
        admin_job_title: formData.job_title,
        assigned_by_user_id: userId,
        requester_role: user?.role || 'admin'
      });

      if (response.success) {
        setShowAddModal(false);
        fetchAdministrators();
      } else {
        setError(response.error || 'Failed to add administrator');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const renderAdminCard = ({ item }: { item: SiteAdministrator }) => (
    <View style={styles.card}>
      <TouchableOpacity
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

      {/* Action Icons */}
      <View style={styles.actions}>
        <IconButton
          icon="eye"
          size={20}
          iconColor={designTokens.color.accent.green500}
          onPress={() => handleAdminPress(item)}
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading administrators..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchAdministrators} />;
  }

  return (
    <View style={styles.wrapper}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Site Administrators</Text>
          <Text style={styles.pageSubtitle}>Manage site administrators and their access permissions</Text>
        </View>
        <View style={styles.headerActions}>
          {administrators.length > 0 && (
            <IconButton
              icon="download"
              size={24}
              iconColor={designTokens.color.accent.green500}
              onPress={handleExportCSV}
            />
          )}
          {user?.role === 'admin' && (
            <Button
              mode="contained"
              onPress={handleOpenAddModal}
              style={styles.addButton}
              icon="plus"
              buttonColor={designTokens.color.accent.green500}
            >
              Add Site Administrator
            </Button>
          )}
        </View>
      </View>

      <View style={styles.container}>
      {administrators.length === 0 && !loading && !error ? (
        <EmptyState
          icon="👤"
          title="No Site Administrators Found"
          message="Get started by adding your first site administrator."
          actionLabel={user?.role === 'admin' ? "Add Administrator" : undefined}
          onAction={handleOpenAddModal}
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
              tintColor={designTokens.color.accent.green500}
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

              <Text style={styles.sectionTitle}>Administrator Information</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedAdmin.name}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedAdmin.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.detailLabel}>Job Title</Text>
                  <Text style={styles.detailValue}>{selectedAdmin.job_title}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.detailLabel}>Role</Text>
                  <Text style={styles.detailValue}>Site Admin</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.detailLabel}>Site</Text>
                  <Text style={styles.detailValue}>
                    #{selectedAdmin.site_number} - {selectedAdmin.site_name}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedAdmin.status.charAt(0).toUpperCase() + selectedAdmin.status.slice(1)}
                  </Text>
                </View>
              </View>

              {selectedAdmin.created_at && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAdmin.created_at).toLocaleString()}
                  </Text>
                </View>
              )}

              {selectedAdmin.record_hash && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Record Hash (21 CFR Part 11 Compliance)</Text>
                    <Text style={[styles.detailValue, styles.hashText]}>
                      {selectedAdmin.record_hash}
                    </Text>
                  </View>
                </>
              )}

              <Button
                mode="contained"
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
                buttonColor={designTokens.color.accent.green500}
              >
                CLOSE
              </Button>
            </ScrollView>
          )}
        </Modal>

        {/* Add Administrator Modal */}
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Site Administrator</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TextInput
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              disabled={submitting}
            />

            <TextInput
              label="Full Name"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              mode="outlined"
              style={styles.input}
              disabled={submitting}
            />

            <TextInput
              label="Job Title"
              value={formData.job_title}
              onChangeText={(text) => setFormData({ ...formData, job_title: text })}
              mode="outlined"
              style={styles.input}
              disabled={submitting}
            />

            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Site</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.site_id}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                  enabled={!submitting && !loadingSites}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a site..." value={null} />
                  {sites.map(site => (
                    <Picker.Item
                      key={site.site_id}
                      label={`${site.site_number} - ${site.site_name}`}
                      value={site.site_id}
                    />
                  ))}
                </Picker>
              </View>
              {loadingSites && (
                <Text style={styles.loadingText}>Loading sites...</Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowAddModal(false)}
                style={styles.cancelButton}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitAddAdmin}
                style={styles.submitButton}
                buttonColor={designTokens.color.accent.green500}
                loading={submitting}
                disabled={submitting}
              >
                Add Administrator
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  pageHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: designTokens.spacing.l,
    paddingVertical: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.light,
  },
  headerContent: {
    marginBottom: designTokens.spacing.m,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
  },
  pageSubtitle: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: designTokens.spacing.s,
  },
  addButton: {
    borderRadius: 8,
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
    borderColor: designTokens.color.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: designTokens.spacing.m,
  },
  avatar: {
    backgroundColor: designTokens.color.accent.green500,
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
    color: designTokens.color.text.default,
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
    color: designTokens.color.text.default,
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
    color: designTokens.color.accent.green500,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: designTokens.spacing.s,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.light,
    paddingTop: designTokens.spacing.s,
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
    backgroundColor: designTokens.color.accent.green500,
  },
  modalAvatarLabel: {
    fontSize: 28,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '600',
    color: designTokens.color.text.default,
    textAlign: 'center',
    marginBottom: designTokens.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.color.text.default,
    marginTop: designTokens.spacing.l,
    marginBottom: designTokens.spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: designTokens.spacing.m,
    gap: designTokens.spacing.m,
  },
  infoColumn: {
    flex: 1,
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
    color: designTokens.color.text.default,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.color.border.light,
    marginVertical: designTokens.spacing.l,
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: designTokens.color.text.subtle,
  },
  closeButton: {
    marginTop: designTokens.spacing.l,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: designTokens.spacing.m,
    borderRadius: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.m,
  },
  errorText: {
    color: '#DC2626',
    fontSize: designTokens.typography.fontSize.m,
  },
  input: {
    marginBottom: designTokens.spacing.m,
  },
  pickerSection: {
    marginBottom: designTokens.spacing.m,
  },
  pickerLabel: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.light,
    borderRadius: designTokens.spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginTop: designTokens.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.m,
    marginTop: designTokens.spacing.l,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

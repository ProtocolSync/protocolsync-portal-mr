import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput, Platform } from 'react-native';
import { Button, Chip, FAB, IconButton } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { sitesService } from '../services/apiClient';
import type { Site } from '@protocolsync/shared-services';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { AppFooter } from '../components/common/AppFooter';
import { SiteDetailModal } from '../components/modals/SiteDetailModal';
import { AddSiteModal, type SiteFormData } from '../components/modals/AddSiteModal';
import { DisableSiteModal } from '../components/modals/DisableSiteModal';
import designTokens from '../design-tokens.json';

export const SitesScreen = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  const fetchSites = useCallback(async () => {
    try {
      setError(null);
      const companyId = user?.company?.id;

      if (!companyId) {
        setError('Company information not available');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await sitesService.getSites(companyId);

      if (response.success && response.data) {
        setSites(response.data);
      } else {
        setError(response.error || 'Failed to load sites');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSites();
  }, [fetchSites]);

  const handleSitePress = (site: Site) => {
    setSelectedSite(site);
    setShowDetailModal(true);
  };

  const handleAddSite = () => {
    setShowAddModal(true);
  };



  const handleSubmitAddSite = async (formData: SiteFormData) => {
    const companyId = user?.company?.id;
    const userId = user?.user_id;

    if (!companyId) {
      throw new Error('Company information not available');
    }

    // Add created_by_user_id for 21 CFR Part 11 compliance
    const siteData = {
      ...formData,
      created_by_user_id: userId,
    };

    const response = await sitesService.createSite(companyId, siteData);

    if (!response.success) {
      throw new Error(response.error || 'Failed to create site');
    }

    fetchSites();
  };

  const handleDisableSite = (site: Site) => {
    setSelectedSite(site);
    setShowDisableModal(true);
  };

  const handleExportCSV = async () => {
    try {
      console.log('[Export] Starting CSV export for sites');
      console.log('[Export] Platform:', Platform.OS);

      // Convert sites to CSV format
      const headers = ['Site Number', 'Site Name', 'Institution', 'City', 'State', 'Country', 'Status', 'PI', 'Active Users', 'Active Trials'];
      const csvData = sites.map(site => [
        site.site_number,
        site.site_name,
        site.institution_name,
        site.city,
        site.state_province,
        site.country,
        site.status.toUpperCase(),
        site.principal_investigator || '',
        site.active_users?.toString() || '0',
        site.active_trials?.toString() || '0'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      console.log('[Export] CSV content created, length:', csvContent.length);

      const fileName = `sites_${new Date().toISOString().split('T')[0]}.csv`;

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
          dialogTitle: 'Export Sites',
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

  const handleSubmitDisableSite = async (reason: string) => {
    if (!selectedSite) {
      throw new Error('No site selected');
    }

    const newStatus = selectedSite.status === 'active' ? 'inactive' : 'active';
    const response = await sitesService.updateSiteStatus(selectedSite.site_id, {
      status: newStatus,
      reason: reason,
      performed_by_user_id: user?.user_id || 0,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update site status');
    }

    fetchSites();
  };


  const renderSiteCard = ({ item }: { item: Site }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => handleSitePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.siteNumber}>#{item.site_number}</Text>
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
        </View>
        <Text style={styles.siteName}>{item.site_name}</Text>
        <Text style={styles.institution}>{item.institution_name}</Text>
        <Text style={styles.location}>
          {item.city}, {item.state_province}, {item.country}
        </Text>
        {item.principal_investigator && (
          <Text style={styles.pi}>PI: {item.principal_investigator}</Text>
        )}
      </TouchableOpacity>

      {/* Action Icons */}
      <View style={styles.actions}>
        <IconButton
          icon="eye"
          size={20}
          iconColor={designTokens.color.accent.green600}
          onPress={() => handleSitePress(item)}
        />
        {user?.role === 'admin' && (
          <IconButton
            icon={item.status === 'active' ? 'lock' : 'lock-open'}
            size={20}
            iconColor={item.status === 'active' ? '#EF4444' : designTokens.color.accent.green600}
            onPress={() => handleDisableSite(item)}
          />
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading sites..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchSites} />;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>Trial Sites</Text>
            <Text style={styles.pageSubtitle}>Manage your clinical trial sites</Text>
          </View>
          <View style={styles.headerActions}>
            {sites.length > 0 && (
              <IconButton
                icon="download"
                size={24}
                iconColor={designTokens.color.accent.green600}
                onPress={handleExportCSV}
              />
            )}
            {user?.role === 'admin' && (
              <Button
                mode="contained"
                icon="plus"
                onPress={handleAddSite}
                style={styles.createButton}
                buttonColor={designTokens.color.accent.green600}
              >
                Create Site
              </Button>
            )}
          </View>
        </View>

        {sites.length === 0 && !loading && !error ? (
          <EmptyState
            icon="🏢"
            title="No Sites Found"
            message="Get started by adding your first trial site."
            actionLabel={user?.role === 'admin' ? "Add Site" : undefined}
            onAction={handleAddSite}
          />
        ) : (
          <FlatList
            data={sites}
            renderItem={renderSiteCard}
            keyExtractor={item => item.site_id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={designTokens.color.accent.green600}
              />
            }
          />
        )}
      </View>
      <AppFooter />

      {/* Modals */}
      <SiteDetailModal
        visible={showDetailModal}
        site={selectedSite}
        companyName={user?.company?.name}
        onClose={() => setShowDetailModal(false)}
      />

      <AddSiteModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitAddSite}
      />

      <DisableSiteModal
        visible={showDisableModal}
        site={selectedSite}
        onClose={() => setShowDisableModal(false)}
        onSubmit={handleSubmitDisableSite}
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
    marginLeft: designTokens.spacing.m,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: designTokens.spacing.s,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    paddingTop: designTokens.spacing.s,
  },
  siteNumber: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.accent.green600,
  },
  statusChip: {
    height: 24,
  },
  statusChipSmall: {
    height: 24,
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
  siteName: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.xs,
  },
  institution: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    marginBottom: designTokens.spacing.xs,
  },
  location: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  pi: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginTop: designTokens.spacing.xs,
    fontStyle: 'italic',
  },
});

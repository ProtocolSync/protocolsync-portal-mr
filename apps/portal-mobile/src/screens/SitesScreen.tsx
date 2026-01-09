import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput } from 'react-native';
import { Button, Chip, FAB, Portal, Modal, IconButton, TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { sitesService } from '../services/apiClient';
import type { Site } from '@protocolsync/shared-services';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '../design-tokens.json';

interface SiteFormData {
  site_number: string;
  site_name: string;
  institution_name: string;
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

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
  const [formData, setFormData] = useState<SiteFormData>({
    site_number: '',
    site_name: '',
    institution_name: '',
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [disableReason, setDisableReason] = useState('');

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
    setFormData({
      site_number: '',
      site_name: '',
      institution_name: '',
      address_line1: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: 'United States',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof SiteFormData, string>> = {};

    if (!formData.site_number.trim()) errors.site_number = 'Site Number is required';
    if (!formData.site_name.trim()) errors.site_name = 'Site Name is required';
    if (!formData.institution_name.trim()) errors.institution_name = 'Institution Name is required';
    if (!formData.address_line1.trim()) errors.address_line1 = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state_province.trim()) errors.state_province = 'State/Province is required';
    if (!formData.postal_code.trim()) errors.postal_code = 'Postal Code is required';
    if (!formData.country.trim()) errors.country = 'Country is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAddSite = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const companyId = user?.company?.id;
      if (!companyId) {
        setError('Company information not available');
        return;
      }

      const response = await sitesService.createSite(companyId, formData);

      if (response.success) {
        setShowAddModal(false);
        fetchSites();
      } else {
        setError(response.error || 'Failed to create site');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableSite = (site: Site) => {
    setSelectedSite(site);
    setDisableReason('');
    setShowDisableModal(true);
  };

  const handleSubmitDisableSite = async () => {
    if (!selectedSite) return;
    if (!disableReason.trim()) {
      setError('Reason is required for 21 CFR Part 11 compliance');
      return;
    }

    setSubmitting(true);
    try {
      const newStatus = selectedSite.status === 'active' ? 'inactive' : 'active';
      const response = await sitesService.updateSiteStatus(selectedSite.site_id, {
        status: newStatus,
        reason: disableReason,
        performed_by_user_id: user?.user_id || 0,
      });

      if (response.success) {
        setShowDisableModal(false);
        fetchSites();
      } else {
        setError(response.error || 'Failed to update site status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const renderSiteCard = ({ item }: { item: Site }) => (
    <View style={styles.card}>
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
        <View style={styles.cardActions}>
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
      <Text style={styles.siteName}>{item.site_name}</Text>
      <Text style={styles.institution}>{item.institution_name}</Text>
      <Text style={styles.location}>
        {item.city}, {item.state_province}, {item.country}
      </Text>
      {item.principal_investigator && (
        <Text style={styles.pi}>PI: {item.principal_investigator}</Text>
      )}
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

      {/* Site Detail Modal */}
      <Portal>
        <Modal
          visible={showDetailModal}
          onDismiss={() => setShowDetailModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedSite && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedSite.site_name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedSite.site_number}</Text>
                </View>
                <Chip
                  style={[
                    styles.statusChip,
                    selectedSite.status === 'active' ? styles.statusActive : styles.statusInactive,
                  ]}
                  textStyle={styles.statusText}
                >
                  {selectedSite.status === 'active' ? 'active' : 'inactive'}
                </Chip>
              </View>

              <Text style={styles.sectionTitle}>Site Information</Text>

              <View style={styles.detailRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Site Number</Text>
                  <Text style={styles.detailValue}>{selectedSite.site_number}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Site Name</Text>
                  <Text style={styles.detailValue}>{selectedSite.site_name}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Company</Text>
                  <Text style={styles.detailValue}>{selectedSite.company || user?.company?.name || 'N/A'}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Chip
                    style={[
                      styles.statusChipSmall,
                      selectedSite.status === 'active' ? styles.statusActive : styles.statusInactive,
                    ]}
                    textStyle={styles.statusText}
                  >
                    {selectedSite.status === 'active' ? 'active' : 'inactive'}
                  </Chip>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Active Users</Text>
                  <Text style={styles.detailValue}>{selectedSite.active_users || 0}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Active Trials</Text>
                  <Text style={styles.detailValue}>{selectedSite.active_trials || 0}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Site Administrator Count</Text>
                  <Text style={styles.detailValue}>{selectedSite.site_administrator_count || 0}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Site Users Count</Text>
                  <Text style={styles.detailValue}>{selectedSite.site_users_count || 0}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {selectedSite.created_at ? new Date(selectedSite.created_at).toLocaleString() : 'N/A'}
                </Text>
              </View>

              {selectedSite.record_hash && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Record Hash (21 CFR Part 11 Compliance)</Text>
                  <Text style={styles.detailValueSmall}>{selectedSite.record_hash}</Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
                buttonColor={designTokens.color.accent.green600}
              >
                CLOSE
              </Button>
            </ScrollView>
          )}
        </Modal>

        {/* Add Site Modal */}
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Site</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowAddModal(false)}
              />
            </View>

            <PaperTextInput
              label="Site Number *"
              value={formData.site_number}
              onChangeText={(text) => setFormData({ ...formData, site_number: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.site_number}
              placeholder="e.g., SITE-004"
            />
            {formErrors.site_number && (
              <HelperText type="error" visible={true}>
                {formErrors.site_number}
              </HelperText>
            )}

            <PaperTextInput
              label="Site Name *"
              value={formData.site_name}
              onChangeText={(text) => setFormData({ ...formData, site_name: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.site_name}
              placeholder="e.g., Boston Medical Center - Oncology"
            />
            {formErrors.site_name && (
              <HelperText type="error" visible={true}>
                {formErrors.site_name}
              </HelperText>
            )}

            <PaperTextInput
              label="Institution Name *"
              value={formData.institution_name}
              onChangeText={(text) => setFormData({ ...formData, institution_name: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.institution_name}
              placeholder="e.g., Boston Medical Center"
            />
            {formErrors.institution_name && (
              <HelperText type="error" visible={true}>
                {formErrors.institution_name}
              </HelperText>
            )}

            <PaperTextInput
              label="Address *"
              value={formData.address_line1}
              onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.address_line1}
              placeholder="e.g., 123 Medical Plaza"
            />
            {formErrors.address_line1 && (
              <HelperText type="error" visible={true}>
                {formErrors.address_line1}
              </HelperText>
            )}

            <PaperTextInput
              label="City *"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.city}
              placeholder="e.g., Boston"
            />
            {formErrors.city && (
              <HelperText type="error" visible={true}>
                {formErrors.city}
              </HelperText>
            )}

            <PaperTextInput
              label="State/Province *"
              value={formData.state_province}
              onChangeText={(text) => setFormData({ ...formData, state_province: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.state_province}
              placeholder="e.g., MA"
            />
            {formErrors.state_province && (
              <HelperText type="error" visible={true}>
                {formErrors.state_province}
              </HelperText>
            )}

            <PaperTextInput
              label="Postal Code *"
              value={formData.postal_code}
              onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.postal_code}
              placeholder="e.g., 02101"
            />
            {formErrors.postal_code && (
              <HelperText type="error" visible={true}>
                {formErrors.postal_code}
              </HelperText>
            )}

            <PaperTextInput
              label="Country *"
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              mode="outlined"
              style={styles.input}
              error={!!formErrors.country}
              placeholder="United States"
            />
            {formErrors.country && (
              <HelperText type="error" visible={true}>
                {formErrors.country}
              </HelperText>
            )}

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitAddSite}
                style={styles.modalButton}
                buttonColor={designTokens.color.accent.green600}
                loading={submitting}
                disabled={submitting}
              >
                Add Site
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Disable Site Modal */}
        <Modal
          visible={showDisableModal}
          onDismiss={() => setShowDisableModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSite?.status === 'active' ? 'Disable' : 'Enable'} Site: {selectedSite?.site_number}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowDisableModal(false)}
              />
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Site Name:</Text>
              <Text style={styles.detailValue}>{selectedSite?.site_name}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Current Status:</Text>
              <Chip
                style={[
                  styles.statusChipSmall,
                  selectedSite?.status === 'active' ? styles.statusActive : styles.statusInactive,
                ]}
                textStyle={styles.statusText}
              >
                {selectedSite?.status === 'active' ? 'active' : 'inactive'}
              </Chip>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>New Status:</Text>
              <Chip
                style={[
                  styles.statusChipSmall,
                  selectedSite?.status === 'active' ? styles.statusInactive : styles.statusActive,
                ]}
                textStyle={styles.statusText}
              >
                {selectedSite?.status === 'active' ? 'inactive' : 'active'}
              </Chip>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Important:</Text>
              {selectedSite?.status === 'active' ? (
                <>
                  <Text style={styles.warningText}>• Users will not be able to upload new documents to this site</Text>
                  <Text style={styles.warningText}>• The site will not count against your subscription limits</Text>
                  <Text style={styles.warningText}>• All existing data remains accessible for viewing</Text>
                  <Text style={styles.warningText}>• This action is fully auditable per 21 CFR Part 11</Text>
                </>
              ) : (
                <>
                  <Text style={styles.warningText}>• Users will be able to upload documents to this site</Text>
                  <Text style={styles.warningText}>• The site will count against your subscription limits</Text>
                  <Text style={styles.warningText}>• This action is fully auditable per 21 CFR Part 11</Text>
                </>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Reason for Status Change *</Text>
              <Text style={styles.helperText}>Required for 21 CFR Part 11 compliance and audit trail</Text>
              <PaperTextInput
                value={disableReason}
                onChangeText={setDisableReason}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.textArea}
                placeholder='e.g., "Site temporarily closed for facility maintenance" or "Site reopening after equipment upgrade"'
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowDisableModal(false)}
                style={styles.modalButton}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitDisableSite}
                style={styles.modalButton}
                buttonColor={selectedSite?.status === 'active' ? '#F59E0B' : designTokens.color.accent.green600}
                loading={submitting}
                disabled={submitting}
              >
                {selectedSite?.status === 'active' ? 'Disable Site' : 'Enable Site'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: designTokens.spacing.m,
    maxHeight: '85%',
  },
  modalContent: {
    padding: designTokens.spacing.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.l,
    paddingBottom: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  modalTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.m,
    marginTop: designTokens.spacing.s,
  },
  detailRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
  },
  detailColumn: {
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
    color: designTokens.color.text.body,
    lineHeight: 22,
  },
  detailValueSmall: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.body,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  closeButton: {
    marginTop: designTokens.spacing.l,
  },
  input: {
    marginBottom: designTokens.spacing.xs,
  },
  textArea: {
    marginTop: designTokens.spacing.s,
  },
  helperText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: designTokens.spacing.m,
    marginTop: designTokens.spacing.l,
    paddingTop: designTokens.spacing.m,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
  },
  modalButton: {
    minWidth: 100,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningTitle: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: designTokens.spacing.s,
  },
  warningText: {
    fontSize: designTokens.typography.fontSize.s,
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 18,
  },
});

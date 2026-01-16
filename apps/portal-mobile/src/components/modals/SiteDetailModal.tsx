import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { Site } from '@protocolsync/shared-services';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface SiteDetailModalProps {
  visible: boolean;
  site: Site | null;
  companyName?: string;
  onClose: () => void;
}

export const SiteDetailModal = ({ visible, site, companyName, onClose }: SiteDetailModalProps) => {
  if (!site) return null;

  const getStatusColor = () => {
    return site.status === 'active' ? '#10B981' : '#6B7280';
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>{site.site_name}</Text>
            <Text style={styles.subtitle}>{site.site_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusBadgeText}>
              {site.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Site Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Site Number</Text>
              <Text style={styles.infoValue}>{site.site_number}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Site Name</Text>
              <Text style={styles.infoValue}>{site.site_name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Company</Text>
              <Text style={styles.infoValue}>{site.company || companyName || 'N/A'}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusBadgeText}>
                  {site.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Active Users</Text>
              <Text style={styles.infoValue}>{site.active_users || 0}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Active Trials</Text>
              <Text style={styles.infoValue}>{site.active_trials || 0}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Site Administrator Count</Text>
              <Text style={styles.infoValue}>{site.site_administrator_count || 0}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Site Users Count</Text>
              <Text style={styles.infoValue}>{site.site_users_count || 0}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {site.created_at ? new Date(site.created_at).toLocaleString() : 'N/A'}
            </Text>
          </View>

          {site.record_hash && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Record Hash (21 CFR Part 11 Compliance)</Text>
              <Text style={styles.hashText}>{site.record_hash}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
            <Text style={styles.closeFooterButtonText}>Close</Text>
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
    alignItems: 'flex-start',
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: designTokens.color.text.subtle,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: designTokens.spacing.m,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.color.text.heading,
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
  infoSection: {
    marginBottom: designTokens.spacing.m,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: designTokens.color.text.body,
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: designTokens.color.text.subtle,
    marginTop: 4,
  },
  footer: {
    padding: designTokens.spacing.l,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
  },
  closeFooterButton: {
    backgroundColor: designTokens.color.accent.green500,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

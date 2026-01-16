import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

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

interface AdminDetailModalProps {
  visible: boolean;
  admin: SiteAdministrator | null;
  onClose: () => void;
}

export const AdminDetailModal = ({ visible, admin, onClose }: AdminDetailModalProps) => {
  if (!admin) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusColor = () => {
    return admin.status === 'active' ? '#10B981' : '#6B7280';
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
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(admin.name)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.title}>{admin.name}</Text>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusBadgeText}>{admin.status.toUpperCase()}</Text>
          </View>

          <Text style={styles.sectionTitle}>Administrator Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{admin.name}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{admin.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Job Title</Text>
              <Text style={styles.infoValue}>{admin.job_title}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>Site Admin</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Site</Text>
              <Text style={styles.infoValue}>
                #{admin.site_number} - {admin.site_name}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
              </Text>
            </View>
          </View>

          {admin.created_at && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(admin.created_at).toLocaleString()}
              </Text>
            </View>
          )}

          {admin.record_hash && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Record Hash (21 CFR Part 11 Compliance)</Text>
                <Text style={styles.hashText}>{admin.record_hash}</Text>
              </View>
            </>
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
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
    position: 'relative',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.m,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: designTokens.color.accent.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: designTokens.spacing.l,
    right: designTokens.spacing.l,
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    textAlign: 'center',
    marginBottom: designTokens.spacing.m,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: designTokens.spacing.l,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.color.text.heading,
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
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.color.border.subtle,
    marginVertical: designTokens.spacing.l,
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: designTokens.color.text.subtle,
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

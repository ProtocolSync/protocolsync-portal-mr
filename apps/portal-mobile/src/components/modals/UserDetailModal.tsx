import React from 'react';
import { Modal, ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip } from 'react-native-paper';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

interface User {
  user_id: number;
  name: string;
  email: string;
  job_title?: string;
  department?: string;
  professional_credentials?: string;
  phone?: string;
  role: 'admin' | 'site_admin' | 'trial_lead' | 'site_user';
  status: 'active' | 'pending' | 'inactive';
  last_login_at?: string;
  assigned_sites?: string;
  site_count?: string;
}

interface UserDetailModalProps {
  visible: boolean;
  user: User | null;
  onDismiss: () => void;
  roleColors: Record<string, string>;
  roleLabels: Record<string, string>;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  user,
  onDismiss,
  roleColors,
  roleLabels,
}) => {
  if (!user) return null;

  const statusColors = {
    active: '#D1FAE5',
    pending: '#FEF3C7',
    inactive: '#FEE2E2',
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{user.name}</Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={getInitials(user.name)}
              style={[styles.avatar, { backgroundColor: roleColors[user.role] }]}
              labelStyle={styles.avatarLabel}
            />
          </View>

          <View style={styles.chips}>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusColors[user.status] }]}
              textStyle={styles.chipText}
            >
              {user.status.toUpperCase()}
            </Chip>
            <Chip
              style={[styles.roleChip, { backgroundColor: roleColors[user.role] }]}
              textStyle={styles.chipText}
            >
              {roleLabels[user.role]}
            </Chip>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>EMAIL</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          {user.job_title && (
            <View style={styles.section}>
              <Text style={styles.label}>JOB TITLE</Text>
              <Text style={styles.value}>{user.job_title}</Text>
            </View>
          )}

          {user.department && (
            <View style={styles.section}>
              <Text style={styles.label}>DEPARTMENT</Text>
              <Text style={styles.value}>{user.department}</Text>
            </View>
          )}

          {user.professional_credentials && (
            <View style={styles.section}>
              <Text style={styles.label}>PROFESSIONAL CREDENTIALS</Text>
              <Text style={styles.value}>{user.professional_credentials}</Text>
            </View>
          )}

          {user.phone && (
            <View style={styles.section}>
              <Text style={styles.label}>PHONE</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </View>
          )}

          {user.assigned_sites && (
            <View style={styles.section}>
              <Text style={styles.label}>ASSIGNED SITES ({user.site_count || '0'})</Text>
              <Text style={styles.value}>{user.assigned_sites}</Text>
            </View>
          )}

          {user.last_login_at && (
            <View style={styles.section}>
              <Text style={styles.label}>LAST LOGIN</Text>
              <Text style={styles.value}>
                {new Date(user.last_login_at).toLocaleString()}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButtonFooter}>
            <Text style={styles.closeButtonText}>Close</Text>
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
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  closeButton: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.m,
  },
  avatar: {
    backgroundColor: designTokens.color.accent.green500,
  },
  avatarLabel: {
    fontSize: 28,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.s,
    marginBottom: designTokens.spacing.l,
  },
  statusChip: {
    height: 28,
  },
  roleChip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: designTokens.spacing.m,
  },
  label: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.default,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: designTokens.spacing.l,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
  },
  closeButtonFooter: {
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

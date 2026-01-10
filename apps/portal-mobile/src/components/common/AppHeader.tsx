import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, IconButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { HelpChatModal } from './HelpChatModal';
import designTokens from '../../design-tokens.json';

interface AppHeaderProps {
  onMenuPress: () => void;
}

export const AppHeader = ({ onMenuPress }: AppHeaderProps) => {
  const { user, logout } = useAuth();
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Role display mapping
  const roleLabels: Record<string, string> = {
    admin: 'ADMIN',
    site_admin: 'SITE ADMIN',
    trial_lead: 'TRIAL LEAD',
    site_user: 'SITE USER',
  };

  return (
    <View style={styles.header}>
      {/* Hamburger Menu */}
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <View style={styles.hamburger}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </View>
      </TouchableOpacity>

      {/* Spacer to push content right */}
      <View style={styles.spacer} />

      {/* Right Side: User Info & Actions */}
      <View style={styles.rightSection}>
        {/* User Profile Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            Hello, {user?.displayName?.split(' ')[0] || 'User'}
          </Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {user?.company?.name || user?.client?.name || 'Protocol Sync'}
          </Text>
        </View>

        {/* Role Switcher */}
        <Menu
          visible={roleMenuVisible}
          onDismiss={() => setRoleMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => setRoleMenuVisible(true)}
            >
              <Text style={styles.roleButtonText}>
                {roleLabels[user?.role || 'site_user']}
              </Text>
              <Text style={styles.roleButtonArrow}>▼</Text>
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => {
              setRoleMenuVisible(false);
              // TODO: Implement role switching
            }}
            title="ADMIN"
            disabled={user?.role !== 'admin'}
          />
          <Menu.Item
            onPress={() => {
              setRoleMenuVisible(false);
              // TODO: Implement role switching
            }}
            title="SITE ADMIN"
            disabled={!['admin', 'site_admin'].includes(user?.role || '')}
          />
          <Menu.Item
            onPress={() => {
              setRoleMenuVisible(false);
              // TODO: Implement role switching
            }}
            title="TRIAL LEAD"
            disabled={!['admin', 'site_admin', 'trial_lead'].includes(user?.role || '')}
          />
          <Menu.Item
            onPress={() => {
              setRoleMenuVisible(false);
              // TODO: Implement role switching
            }}
            title="SITE USER"
          />
        </Menu>

        {/* Help Button */}
        <IconButton
          icon="lifebuoy"
          size={24}
          iconColor={designTokens.color.accent.green600}
          onPress={() => setHelpModalVisible(true)}
        />

        {/* Sign Out Link */}
        <TouchableOpacity onPress={logout}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Help Chat Modal */}
      <HelpChatModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: designTokens.color.brand.primary,
    borderRadius: 2,
  },
  spacer: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: designTokens.color.brand.primary,
    maxWidth: 120,
  },
  companyName: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    maxWidth: 120,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.color.accent.green500,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  roleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as any,
  },
  roleButtonArrow: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  signOutText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500' as any,
  },
});

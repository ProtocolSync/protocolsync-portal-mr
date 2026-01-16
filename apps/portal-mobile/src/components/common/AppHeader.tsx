import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';
import type { DrawerParamList } from '../../navigation/AppNavigator';

interface AppHeaderProps {
  onMenuPress: () => void;
}

export const AppHeader = ({ onMenuPress }: AppHeaderProps) => {
  const { user, logout } = useAuth();
  const { activeRole, setActiveRole, canSwitchRole, availableRoles } = useRole();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);

  const handleRoleModeChange = (newRole: string) => {
    console.log('[AppHeader] Switching role to:', newRole);
    setActiveRole(newRole as any);
    setRoleMenuVisible(false);
    
    // Navigate to home/dashboard after role switch
    navigation.navigate('Home');
  };

  // Role display - use activeRole if available, fallback to user.role
  const displayRole = activeRole || user?.role || 'site_user';
  const roleLabel = availableRoles.find(r => r.value === displayRole)?.label || displayRole.toUpperCase().replace(/_/g, ' ');

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
        {canSwitchRole ? (
          <Menu
            visible={roleMenuVisible}
            onDismiss={() => setRoleMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.roleButton}
                onPress={() => setRoleMenuVisible(true)}
              >
                <Text style={styles.roleButtonText}>
                  {roleLabel}
                </Text>
                <Text style={styles.roleButtonArrow}>▼</Text>
              </TouchableOpacity>
            }
          >
            {availableRoles.map((role) => (
              <Menu.Item
                key={role.value}
                onPress={() => handleRoleModeChange(role.value)}
                title={role.label}
              />
            ))}
          </Menu>
        ) : (
          <TouchableOpacity
            style={styles.roleButton}
            disabled
          >
            <Text style={styles.roleButtonText}>
              {roleLabel}
            </Text>
          </TouchableOpacity>
        )}

        {/* Sign Out Link */}
        <TouchableOpacity onPress={logout}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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

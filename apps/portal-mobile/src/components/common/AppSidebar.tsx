import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';
import { HelpChatModal } from './HelpChatModal';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

export const AppSidebar = (props: DrawerContentComponentProps) => {
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Navigation items based on role
  const getNavigationItems = () => {
    // Use activeRole if available, otherwise fall back to user.role
    const role = activeRole || user?.role || 'site_user';

    const commonItems = [
      { label: 'Dashboard', icon: '📊', screen: 'Home', section: null },
    ];

    if (role === 'admin') {
      return [
        ...commonItems,
        { label: 'Sites', icon: '🏢', screen: 'Sites', section: 'MANAGEMENT' },
        { label: 'Site Administrators', icon: '👤', screen: 'Admins', section: 'MANAGEMENT' },
        { label: 'Users', icon: '👥', screen: 'Users', section: 'MANAGEMENT' },
        { label: 'Reports', icon: '📊', screen: 'Reports', section: 'COMPLIANCE' },
        { label: 'Billing', icon: '💳', screen: 'Billing', section: 'ACCOUNT' },
        { label: 'Help', icon: '❓', screen: 'Help', section: 'ACCOUNT' },
      ];
    }

    if (role === 'site_admin') {
      return [
        ...commonItems,
        { label: 'Manage Trials', icon: '🔬', screen: 'Trials', section: 'TRIALS' },
        { label: 'Site Users', icon: '👥', screen: 'SiteUsers', section: 'MANAGEMENT' },
        { label: 'Reports', icon: '📊', screen: 'Reports', section: 'COMPLIANCE' },
        { label: 'Help', icon: '❓', screen: 'Help', section: 'ACCOUNT' },
      ];
    }

    if (role === 'trial_lead') {
      return [
        ...commonItems,
        { label: 'Protocol Versions', icon: '📄', screen: 'Protocols', section: 'TRIAL MANAGEMENT' },
        { label: 'Delegation Log', icon: '📋', screen: 'DelegationLog', section: 'TRIAL MANAGEMENT' },
        { label: 'Help', icon: '❓', screen: 'Help', section: 'ACCOUNT' },
      ];
    }

    // site_user
    return [
      ...commonItems,
      { label: 'My Protocols', icon: '📄', screen: 'MyProtocols', section: 'PROTOCOLS' },
      { label: 'Help', icon: '❓', screen: 'Help', section: 'ACCOUNT' },
    ];
  };

  const navigationItems = getNavigationItems();

  // Group items by section
  const sections = navigationItems.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  return (
    <View style={styles.container}>
      {/* Sidebar Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/protocolsync-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>PROTOCOL SYNC</Text>
        </View>
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.navigation}>
        {Object.entries(sections).map(([sectionName, items]) => (
          <View key={sectionName}>
            {sectionName !== 'main' && (
              <Text style={styles.sectionTitle}>{sectionName}</Text>
            )}
            {items.map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={[
                  styles.navItem,
                  props.state.routeNames[props.state.index] === item.screen && styles.navItemActive,
                ]}
                onPress={() => {
                  if (item.screen === 'Help') {
                    setHelpModalVisible(true);
                    props.navigation.closeDrawer();
                  } else {
                    props.navigation.navigate(item.screen as any);
                  }
                }}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.navLabel,
                    props.state.routeNames[props.state.index] === item.screen && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Footer with version */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Protocol Sync LLC.</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Terms of Service</Text>
          <Text style={styles.footerSeparator}>|</Text>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: designTokens.color.accent.green700,
  },
  header: {
    backgroundColor: designTokens.color.accent.green700,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.accent.green900,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  navigation: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  navIcon: {
    fontSize: 20,
    width: 24,
  },
  navLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500' as any,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600' as any,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.accent.green900,
    backgroundColor: designTokens.color.accent.green700,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 11,
    color: '#6366F1',
    textAlign: 'center',
  },
  footerSeparator: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

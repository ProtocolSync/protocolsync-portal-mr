import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import designTokens from '../design-tokens.json';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

export const LoginScreen = () => {
  const { login, loading, error: authError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    try {
      await login();
    } catch (err: any) {
      if (err?.errorCode !== 'user_cancelled' && err?.message !== 'User cancelled') {
        setLocalError('Login failed. Please try again.');
      }
    }
  };

  const error = authError || localError;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Login Card */}
        <Card style={[styles.card, isLargeScreen && styles.cardLarge]}>
          <Card.Content style={styles.cardContent}>
            {/* Logo and Title */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/protocolsync-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandText}>PROTOCOL SYNC</Text>
              </View>
            </View>

            {/* Login Section */}
            <View style={styles.loginSection}>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>Sign in to your compliance portal</Text>

              {/* Error Alert */}
              {error && (
                <View style={styles.errorAlert}>
                  <Text style={styles.errorText}>
                    <Text style={styles.errorBold}>Access Denied: </Text>
                    {error}
                  </Text>
                </View>
              )}

              {/* Microsoft Sign In Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.buttonText}>Signing in...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <MicrosoftIcon />
                    <Text style={styles.buttonText}>Sign in with Microsoft</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Footer Text */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>For site users only</Text>
                <Text style={styles.footerText}>Protected by Microsoft Entra ID</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Sign Up Card (for larger screens) */}
        {isLargeScreen && (
          <Card style={[styles.card, styles.signupCard]}>
            <Card.Content style={styles.signupContent}>
              <Text style={styles.signupTitle}>Sign up</Text>
              <Text style={styles.signupText}>
                Access your clinical trial protocols, delegation logs, and compliance
                documentation in one secure location.
              </Text>
              <Text style={[styles.signupText, styles.signupTextSecondary]}>
                Streamlined protocol management for research sites and sponsors.
              </Text>
              <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.registerButtonText}>Register Now!</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

// Microsoft Logo SVG Component
const MicrosoftIcon = () => (
  <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap' }}>
    <View style={{ width: 9, height: 9, backgroundColor: '#F25022' }} />
    <View style={{ width: 9, height: 9, backgroundColor: '#7FBA00', marginLeft: 2 }} />
    <View style={{ width: 9, height: 9, backgroundColor: '#00A4EF', marginTop: 2 }} />
    <View style={{ width: 9, height: 9, backgroundColor: '#FFB900', marginTop: 2, marginLeft: 2 }} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: designTokens.spacing.m,
  },
  content: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    maxWidth: isLargeScreen ? 900 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: designTokens.color.background.card,
    borderRadius: 8,
    shadowColor: designTokens.shadow.card.shadowColor,
    shadowOffset: designTokens.shadow.card.shadowOffset,
    shadowOpacity: designTokens.shadow.card.shadowOpacity,
    shadowRadius: designTokens.shadow.card.shadowRadius,
    elevation: designTokens.shadow.card.elevation,
  },
  cardLarge: {
    flex: 1,
    marginRight: designTokens.spacing.m,
  },
  cardContent: {
    padding: designTokens.spacing.l,
  },
  header: {
    marginBottom: designTokens.spacing.l,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    height: 40,
    width: 40,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: designTokens.color.accent.green500,
    letterSpacing: 0.5,
  },
  loginSection: {
    marginTop: designTokens.spacing.m,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '700' as any,
    color: designTokens.color.text.default,
    marginBottom: designTokens.spacing.xs,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.l,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: designTokens.color.text.error,
    padding: designTokens.spacing.m,
    borderRadius: 4,
    marginBottom: designTokens.spacing.l,
  },
  errorText: {
    color: '#991b1b',
    fontSize: designTokens.typography.fontSize.s,
  },
  errorBold: {
    fontWeight: '700' as any,
  },
  loginButton: {
    backgroundColor: designTokens.color.accent.green500,
    borderRadius: 6,
    padding: designTokens.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.m,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600' as any,
  },
  footer: {
    marginTop: designTokens.spacing.m,
    alignItems: 'center',
  },
  footerText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.color.text.subtle,
    marginVertical: 2,
  },
  signupCard: {
    backgroundColor: designTokens.color.accent.green500,
    flex: isLargeScreen ? 0.7 : undefined,
    marginTop: isLargeScreen ? 0 : designTokens.spacing.l,
  },
  signupContent: {
    padding: designTokens.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    marginBottom: designTokens.spacing.m,
  },
  signupText: {
    fontSize: designTokens.typography.fontSize.s,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: designTokens.spacing.m,
    lineHeight: 22,
  },
  signupTextSecondary: {
    marginTop: designTokens.spacing.s,
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: designTokens.spacing.s,
    paddingHorizontal: designTokens.spacing.l,
    marginTop: designTokens.spacing.m,
  },
  registerButtonText: {
    color: designTokens.color.accent.green500,
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600' as any,
  },
});

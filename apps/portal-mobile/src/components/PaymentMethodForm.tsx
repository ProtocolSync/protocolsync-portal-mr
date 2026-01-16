import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Text, TextInput, Button, Checkbox } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useAuth } from '../contexts/AuthContext';
import _designTokens  from '@protocolsync/shared-styles/mobile/tokens';
import { billingService } from '../services/apiClient';

interface PaymentMethodFormProps {
  onSuccess: () => void;
}

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SZgyVIDe9lJOpslHSU9alzFtESzV34EwnIfB9mdZtJDtINMslzjUvnN8I9zYs0Iv3Qr4dRr55iBjLIki9jdzem400LpZFanJ3';

export const PaymentMethodForm = ({ onSuccess }: PaymentMethodFormProps) => {
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [cardholderName, setCardholderName] = useState(user?.displayName || '');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);

  // For web platform: Load Stripe.js and initialize elements
  useEffect(() => {
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        // @ts-ignore
        const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        setStripeInstance(stripe);
        
        const elements = stripe.elements();
        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#374151',
              '::placeholder': { color: '#9ca3af' },
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            invalid: { color: '#dc2626' }
          }
        });
        
        const cardElementDiv = document.getElementById('card-element-web');
        if (cardElementDiv) {
          cardElement.mount('#card-element-web');
          // @ts-ignore
          window.cardElement = cardElement;
          setStripeReady(true);
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleSubmit = async () => {
    if (!user?.company?.id || !user?.id) {
      setError('User information not available');
      return;
    }

    if (!cardholderName.trim()) {
      setError('Please enter cardholder name');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create setup intent from backend using service
      const secret = await billingService.createSetupIntent(
        Number(user.company.id),
        Number(user.id)
      );

      // Step 2: Handle platform-specific confirmation
      if (Platform.OS === 'web') {
        // Web: Use Stripe.js directly
        if (!stripeInstance) {
          throw new Error('Stripe not initialized');
        }
        
        // @ts-ignore
        const cardElement = window.cardElement;
        if (!cardElement) {
          throw new Error('Card element not initialized');
        }

        const { setupIntent, error: stripeError } = await stripeInstance.confirmCardSetup(secret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardholderName }
          }
        });

        if (stripeError) {
          throw new Error(stripeError.message || 'Card validation failed');
        }

        if (!setupIntent?.payment_method) {
          throw new Error('No payment method returned');
        }

        // Step 3: Save payment method to backend
        await billingService.savePaymentMethod(
          Number(user.company.id),
          Number(user.id),
          setupIntent.payment_method,
          true
        );

        // Success!
        setProcessing(false);
        setCardholderName('');
        setAgreedToTerms(false);
        // @ts-ignore
        if (window.cardElement) window.cardElement.clear();
        onSuccess();
      } else {
        // Native: Set client secret for WebView to handle Stripe confirmation
        setClientSecret(secret);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment method');
      setProcessing(false);
    }
  };

  const handleStripeMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'stripe_ready') {
        setStripeReady(true);
      } else if (data.type === 'stripe_error') {
        throw new Error(data.message || 'Card validation failed');
      } else if (data.type === 'stripe_success') {
        const paymentMethodId = data.payment_method_id;

        if (!paymentMethodId) {
          throw new Error('No payment method returned');
        }

        if (!user?.company?.id || !user?.id) {
          throw new Error('User information not available');
        }

        // Step 3: Save payment method to backend using service
        await billingService.savePaymentMethod(
          Number(user.company.id),
          Number(user.id),
          paymentMethodId,
          true
        );

        // Success!
        setProcessing(false);
        setCardholderName('');
        setAgreedToTerms(false);
        setClientSecret(null);
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment method');
      setProcessing(false);
      setClientSecret(null);
    }
  };

  // Generate HTML for Stripe WebView
  const stripeHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://js.stripe.com/v3/"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #card-element {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
        }
        .error {
          color: #dc2626;
          font-size: 14px;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div id="card-element"></div>
      <div id="card-errors" class="error"></div>
      <script>
        const stripe = Stripe('${STRIPE_PUBLISHABLE_KEY}');
        const elements = stripe.elements();
        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#374151',
              '::placeholder': { color: '#9ca3af' },
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            invalid: { color: '#dc2626' }
          }
        });

        cardElement.mount('#card-element');

        cardElement.on('ready', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stripe_ready' }));
        });

        cardElement.on('change', (event) => {
          const displayError = document.getElementById('card-errors');
          if (event.error) {
            displayError.textContent = event.error.message;
          } else {
            displayError.textContent = '';
          }
        });

        // Listen for confirmation request
        window.confirmCard = async (clientSecret, cardholderName) => {
          try {
            const result = await stripe.confirmCardSetup(clientSecret, {
              payment_method: {
                card: cardElement,
                billing_details: { name: cardholderName }
              }
            });

            if (result.error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stripe_error',
                message: result.error.message
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stripe_success',
                payment_method_id: result.setupIntent.payment_method
              }));
            }
          } catch (err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stripe_error',
              message: err.message || 'Unknown error'
            }));
          }
        };
      </script>
    </body>
    </html>
  `;

  // Trigger Stripe confirmation when clientSecret is set
  useEffect(() => {
    if (clientSecret && stripeReady && webViewRef.current && Platform.OS !== 'web') {
      const escapedName = cardholderName.replace(/'/g, "\\'").replace(/"/g, '\\"');
      webViewRef.current.injectJavaScript(
        `confirmCard('${clientSecret}', '${escapedName}'); true;`
      );
    }
  }, [clientSecret, stripeReady, cardholderName]);

  if (processing && clientSecret) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={_designTokens.color.accent.green600} />
        <Text style={styles.loadingText}>Processing payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>✕ {error}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cardholder Name</Text>
        <TextInput
          mode="outlined"
          value={cardholderName}
          onChangeText={setCardholderName}
          placeholder={user?.displayName || 'Cardholder Name'}
          style={styles.input}
          disabled={processing}
          outlineColor={_designTokens.color.border.medium}
          activeOutlineColor={_designTokens.color.accent.green600}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Card Information</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.cardElementWeb}>
            <div id="card-element-web" style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white'
            }}></div>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: stripeHTML }}
            style={styles.webView}
            onMessage={handleStripeMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            scalesPageToFit={false}
          />
        )}
      </View>

      <View style={styles.secureNotice}>
        <Text style={styles.lockIcon}>🔒</Text>
        <View style={styles.secureTextContainer}>
          <Text style={styles.secureTitle}>Secure Payment</Text>
          <Text style={styles.secureDescription}>
            Your payment information is encrypted and secured by Stripe. We never store your card details.
          </Text>
        </View>
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          status={agreedToTerms ? 'checked' : 'unchecked'}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          color={_designTokens.color.accent.green600}
          disabled={processing}
        />
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text
            style={styles.link}
            onPress={() => {
              /* Open terms link */
            }}
          >
            Terms of Service
          </Text>
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={processing || !stripeReady || !agreedToTerms}
        loading={processing}
        style={styles.submitButton}
        buttonColor={
          processing || !stripeReady || !agreedToTerms
            ? _designTokens.color.text.subtle
            : _designTokens.color.accent.green600
        }
        labelStyle={styles.submitButtonLabel}
      >
        {processing ? 'Processing...' : 'Save Payment Method'}
      </Button>

      <Text style={styles.disclaimer}>
        By providing your card information, you authorize us to charge this card for future payments in accordance with our terms.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: _designTokens.spacing.m,
  },
  loadingContainer: {
    padding: _designTokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: _designTokens.spacing.m,
    color: _designTokens.color.text.default,
    fontSize: _designTokens.typography.fontSize.m,
  },
  errorBanner: {
    marginBottom: _designTokens.spacing.m,
    padding: _designTokens.spacing.m,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
  },
  errorText: {
    color: '#7f1d1d',
    fontSize: _designTokens.typography.fontSize.s,
    fontWeight: '600' as const,
  },
  inputContainer: {
    marginBottom: _designTokens.spacing.m,
  },
  label: {
    fontSize: _designTokens.typography.fontSize.s,
    fontWeight: '600' as const,
    marginBottom: _designTokens.spacing.xs,
    color: _designTokens.color.text.default,
  },
  input: {
    backgroundColor: _designTokens.color.background.card,
  },
  webView: {
    height: 80,
    backgroundColor: 'transparent',
  },
  cardElementWeb: {
    height: 50,
    marginBottom: _designTokens.spacing.s,
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: _designTokens.spacing.m,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    marginBottom: _designTokens.spacing.m,
  },
  lockIcon: {
    fontSize: 20,
    marginRight: _designTokens.spacing.s,
  },
  secureTextContainer: {
    flex: 1,
  },
  secureTitle: {
    fontSize: _designTokens.typography.fontSize.s,
    fontWeight: '600' as const,
    color: '#166534',
    marginBottom: 2,
  },
  secureDescription: {
    fontSize: _designTokens.typography.fontSize.xs,
    color: '#166534',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: _designTokens.spacing.m,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: _designTokens.typography.fontSize.s,
    color: _designTokens.color.text.default,
  },
  link: {
    color: _designTokens.color.accent.green600,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginBottom: _designTokens.spacing.m,
    borderRadius: 8,
  },
  submitButtonLabel: {
    fontSize: _designTokens.typography.fontSize.m,
    fontWeight: '600' as const,
    paddingVertical: _designTokens.spacing.xs,
  },
  disclaimer: {
    fontSize: _designTokens.typography.fontSize.xs,
    color: _designTokens.color.text.subtle,
    textAlign: 'center',
  },
});

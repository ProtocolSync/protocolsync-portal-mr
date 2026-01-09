import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '../design-tokens.json';

interface Subscription {
  subscription_id: number;
  plan_name: string;
  display_name: string;
  monthly_price: number;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface PaymentMethod {
  payment_method_id: number;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface Invoice {
  invoice_id: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'void';
  invoice_pdf_url: string;
  period_start: string;
  period_end: string;
}

export const BillingScreen = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'invoices'>('overview');

  const fetchBillingData = useCallback(async () => {
    try {
      setError(null);
      const companyId = user?.company?.id;

      if (!companyId) {
        setError('Company information not available');
        return;
      }

      // Fetch subscription
      const subResponse = await api.get<{ subscription: Subscription }>(
        `/companies/${companyId}/subscription`
      );
      if (subResponse.success && subResponse.data) {
        setSubscription(subResponse.data.subscription);
      }

      // Fetch payment methods
      const pmResponse = await api.get<{ payment_methods: PaymentMethod[] }>(
        `/companies/${companyId}/payment-methods`
      );
      if (pmResponse.success && pmResponse.data) {
        setPaymentMethods(pmResponse.data.payment_methods || []);
      }

      // Fetch invoices
      const invResponse = await api.get<{ invoices: Invoice[] }>(
        `/companies/${companyId}/invoices?limit=10`
      );
      if (invResponse.success && invResponse.data) {
        setInvoices(invResponse.data.invoices || []);
      }
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBillingData();
  }, [fetchBillingData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return '#D1FAE5';
      case 'trialing':
      case 'pending':
        return '#FEF3C7';
      case 'canceled':
      case 'failed':
      case 'past_due':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading billing information..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchBillingData} />;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={designTokens.color.accent.green600}
          />
        }
      >
        <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payment' && styles.tabActive]}
            onPress={() => setActiveTab('payment')}
          >
            <Text style={[styles.tabText, activeTab === 'payment' && styles.tabTextActive]}>
              Payment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
            onPress={() => setActiveTab('invoices')}
          >
            <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>
              Invoices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && subscription && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Current Subscription</Text>

              <View style={styles.subscriptionHeader}>
                <Text style={styles.planName}>{subscription.display_name}</Text>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(subscription.status) }]}
                  textStyle={styles.statusText}
                >
                  {subscription.status.toUpperCase()}
                </Chip>
              </View>

              <Text style={styles.price}>
                {formatCurrency(subscription.monthly_price)}/month
              </Text>

              <Divider style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Period</Text>
                <Text style={styles.detailValue}>
                  {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Billing Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </Text>
              </View>

              {subscription.cancel_at_period_end && (
                <Card style={styles.warningCard}>
                  <Card.Content>
                    <Text style={styles.warningText}>
                      ⚠️ Your subscription will be canceled at the end of the current billing period.
                    </Text>
                  </Card.Content>
                </Card>
              )}

              <Button
                mode="outlined"
                onPress={() => {/* TODO: Manage subscription */}}
                style={styles.button}
              >
                Manage Subscription
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Payment Methods</Text>

              {paymentMethods.length === 0 ? (
                <Text style={styles.emptyText}>No payment methods on file</Text>
              ) : (
                paymentMethods.map(pm => (
                  <View key={pm.payment_method_id} style={styles.paymentMethod}>
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.cardBrand}>{pm.card_brand.toUpperCase()}</Text>
                      <Text style={styles.cardNumber}>•••• {pm.card_last4}</Text>
                      <Text style={styles.cardExpiry}>
                        Expires {pm.card_exp_month}/{pm.card_exp_year}
                      </Text>
                    </View>
                    {pm.is_default && (
                      <Chip style={styles.defaultChip} textStyle={styles.defaultChipText}>
                        Default
                      </Chip>
                    )}
                  </View>
                ))
              )}

              <Button
                mode="contained"
                onPress={() => {/* TODO: Add payment method */}}
                style={styles.button}
                buttonColor={designTokens.color.accent.green600}
              >
                Add Payment Method
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Recent Invoices</Text>

              {invoices.length === 0 ? (
                <Text style={styles.emptyText}>No invoices available</Text>
              ) : (
                invoices.map(invoice => (
                  <TouchableOpacity
                    key={invoice.invoice_id}
                    style={styles.invoiceItem}
                    onPress={() => {/* TODO: Download invoice */}}
                  >
                    <View style={styles.invoiceInfo}>
                      <Text style={styles.invoiceDate}>
                        {new Date(invoice.period_start).toLocaleDateString()}
                      </Text>
                      <Text style={styles.invoiceAmount}>
                        {formatCurrency(invoice.amount)}
                      </Text>
                    </View>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(invoice.status) }]}
                      textStyle={styles.statusText}
                    >
                      {invoice.status.toUpperCase()}
                    </Chip>
                  </TouchableOpacity>
                ))
              )}
            </Card.Content>
          </Card>
        )}

        {/* Support Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>💳 Billing Support</Text>
            <Text style={styles.infoText}>
              Have questions about your billing?{'\n'}
              Contact us at support@protocolsync.org
            </Text>
          </Card.Content>
        </Card>

        </View>
      </ScrollView>
      <AppFooter />
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
  content: {
    padding: designTokens.spacing.m,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: designTokens.spacing.m,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: designTokens.color.accent.green600,
    borderRadius: designTokens.spacing.s,
  },
  tabText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    marginBottom: designTokens.spacing.m,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.m,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.s,
  },
  planName: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    flex: 1,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  price: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '700',
    color: designTokens.color.accent.green600,
    marginBottom: designTokens.spacing.l,
  },
  divider: {
    marginVertical: designTokens.spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.s,
  },
  detailLabel: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  detailValue: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    marginTop: designTokens.spacing.m,
  },
  warningText: {
    fontSize: designTokens.typography.fontSize.m,
    color: '#92400E',
  },
  button: {
    marginTop: designTokens.spacing.l,
  },
  emptyText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
    textAlign: 'center',
    paddingVertical: designTokens.spacing.xl,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.m,
    backgroundColor: designTokens.color.background.subtle,
    borderRadius: designTokens.spacing.s,
    marginBottom: designTokens.spacing.m,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: designTokens.typography.fontSize.s,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  defaultChip: {
    backgroundColor: designTokens.color.accent.green600,
  },
  defaultChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.m,
    backgroundColor: designTokens.color.background.subtle,
    borderRadius: designTokens.spacing.s,
    marginBottom: designTokens.spacing.m,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDate: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    marginBottom: 2,
  },
  invoiceAmount: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    marginTop: designTokens.spacing.m,
  },
  infoTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.s,
  },
  infoText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    lineHeight: 22,
  },
});

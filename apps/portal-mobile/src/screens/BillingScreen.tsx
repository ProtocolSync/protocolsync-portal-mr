import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking, Platform } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import {
  billingService,
  type Subscription,
  type PaymentMethod,
  type SubscriptionPlan,
  type BillingStats,
  type Invoice
} from '../services/billingService';
import { LoadingState } from '../components/common/LoadingState';
import { AppFooter } from '../components/common/AppFooter';
import { PaymentMethodForm } from '../components/PaymentMethodForm';
import designTokens from '../design-tokens.json';

export const BillingScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'payment' | 'invoices'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<BillingStats>({ activeSites: 0, siteAdmins: 0, activeTrials: 0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchBillingData = useCallback(async () => {
    try {
      const companyId = user?.company?.id;
      if (!companyId) return;

      const data = await billingService.getAllBillingData(Number(companyId));

      setSubscription(data.subscription);
      setPaymentMethods(data.paymentMethods);
      setPlans(data.plans);
      setStats(data.stats);
      setInvoices(data.invoices);
    } catch (err) {
      console.error('Error fetching billing data:', err);
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

  const getTierColor = (planName?: string) => {
    if (!planName) return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };

    switch (planName.toLowerCase()) {
      case 'starter':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'professional':
        return { bg: designTokens.color.accent.green100, text: designTokens.color.brand.primary };
      case 'growth':
        return { bg: designTokens.color.background.focus, text: designTokens.color.brand.primary };
      case 'pilot':
        return { bg: '#fce7f3', text: '#831843' };
      default:
        return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };

    switch (status.toLowerCase()) {
      case 'paid':
        return { bg: designTokens.color.accent.green100, text: designTokens.color.accent.green700 };
      case 'pending':
      case 'open':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'failed':
      case 'void':
        return { bg: '#fee2e2', text: designTokens.color.text.error };
      default:
        return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };
    }
  };

  const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);
  const tierColors = subscription?.plan_name ? getTierColor(subscription.plan_name) : { bg: '#f3f4f6', text: '#374151' };

  if (loading && !refreshing) {
    return <LoadingState message="Loading billing information..." />;
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
          {/* Page Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Billing & Subscription</Text>
            <Text style={styles.subtitle}>Manage your subscription and payment methods</Text>
          </View>

          {/* Tab Navigation */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
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
                style={[styles.tab, activeTab === 'plans' && styles.tabActive]}
                onPress={() => setActiveTab('plans')}
              >
                <Text style={[styles.tabText, activeTab === 'plans' && styles.tabTextActive]}>
                  Plans
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
          </ScrollView>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View>
              {/* Current Subscription Card */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Current Subscription</Text>

                  <View style={styles.subscriptionHeader}>
                    <Chip
                      style={[styles.planChip, { backgroundColor: tierColors.bg }]}
                      textStyle={[styles.planChipText, { color: tierColors.text }]}
                    >
                      {subscription?.display_name || 'No Subscription'}
                    </Chip>
                    <Text style={styles.statusText}>
                      {subscription?.status === 'trialing' ? 'Free Trial' : subscription?.status || 'Inactive'}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>${subscription?.monthly_price || 0}</Text>
                    <Text style={styles.priceUnit}>/mo</Text>
                  </View>

                  <Text style={styles.nextBilling}>
                    {subscription?.current_period_end
                      ? `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      : 'No active subscription'}
                  </Text>

                  <Button
                    mode="outlined"
                    onPress={() => {}}
                    style={styles.changeButton}
                    textColor={designTokens.color.brand.primary}
                  >
                    {subscription ? 'Change Plan' : 'Start Trial'}
                  </Button>

                  {subscription?.cancel_at_period_end && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        ⚠️ Subscription will be canceled on {new Date(subscription.current_period_end).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>

              {/* Payment Method Card */}
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Payment Method</Text>
                    <Button
                      mode="outlined"
                      onPress={() => setActiveTab('payment')}
                      compact
                      textColor={designTokens.color.brand.primary}
                    >
                      {defaultPaymentMethod ? 'Update' : 'Add'}
                    </Button>
                  </View>

                  {defaultPaymentMethod ? (
                    <View style={styles.paymentMethodDisplay}>
                      <View style={styles.cardBrandBox}>
                        <Text style={styles.cardBrandText}>
                          {defaultPaymentMethod.card_brand.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.cardDetails}>
                        <Text style={styles.cardNumber}>
                          •••• •••• •••• {defaultPaymentMethod.card_last4}
                        </Text>
                        <Text style={styles.cardExpiry}>
                          Expires {defaultPaymentMethod.card_exp_month}/{defaultPaymentMethod.card_exp_year}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No payment method on file</Text>
                  )}
                </Card.Content>
              </Card>

              {/* Usage Stats */}
              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <Card.Content>
                    <Text style={styles.statLabel}>Active Sites</Text>
                    <Text style={styles.statValue}>{stats.activeSites}</Text>
                  </Card.Content>
                </Card>

                <Card style={styles.statCard}>
                  <Card.Content>
                    <Text style={styles.statLabel}>Site Administrators</Text>
                    <Text style={styles.statValue}>{stats.siteAdmins}</Text>
                  </Card.Content>
                </Card>

                <Card style={styles.statCard}>
                  <Card.Content>
                    <Text style={styles.statLabel}>Active Trials</Text>
                    <Text style={styles.statValue}>{stats.activeTrials}</Text>
                  </Card.Content>
                </Card>
              </View>
            </View>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <View>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Choose Your Plan</Text>
                </Card.Content>
              </Card>

              {plans.map(plan => {
                const isCurrentPlan = subscription?.plan_name === plan.plan_name;
                const planColor = getTierColor(plan.plan_name);

                return (
                  <Card
                    key={plan.plan_id}
                    style={[
                      styles.planCard,
                      isCurrentPlan && { borderWidth: 2, borderColor: designTokens.color.accent.green600 }
                    ]}
                  >
                    <Card.Content>
                      <Text style={styles.planName}>{plan.display_name}</Text>

                      <View style={styles.planPriceContainer}>
                        {plan.monthly_price > 0 ? (
                          <>
                            <Text style={styles.planPrice}>${plan.monthly_price}</Text>
                            <Text style={styles.planPriceUnit}>/mo</Text>
                          </>
                        ) : (
                          <Text style={styles.planPriceCustom}>Custom Pricing</Text>
                        )}
                      </View>

                      {plan.features.features_list && (
                        <View style={styles.featuresList}>
                          {plan.features.features_list.map((feature, idx) => (
                            <Text key={idx} style={styles.featureItem}>
                              ✓ {feature}
                            </Text>
                          ))}
                        </View>
                      )}

                      <Button
                        mode="contained"
                        onPress={() => {}}
                        disabled={isCurrentPlan}
                        style={styles.subscribeButton}
                        buttonColor={isCurrentPlan ? designTokens.color.text.subtle : designTokens.color.accent.green600}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                      </Button>

                      {plan.monthly_price > 0 && !subscription && (
                        <Text style={styles.trialText}>14-day free trial</Text>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <View>
              {/* Existing Payment Methods */}
              {paymentMethods.length > 0 && (
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.cardTitle}>Your Payment Methods</Text>
                    {paymentMethods.map((pm) => (
                      <View key={pm.payment_method_id} style={styles.paymentMethodRow}>
                        <View style={styles.paymentMethodDisplay}>
                          <View style={styles.cardBrandBox}>
                            <Text style={styles.cardBrandText}>
                              {pm.card_brand.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.cardDetails}>
                            <Text style={styles.cardNumber}>
                              •••• •••• •••• {pm.card_last4}
                            </Text>
                            <Text style={styles.cardExpiry}>
                              Expires {pm.card_exp_month}/{pm.card_exp_year}
                            </Text>
                          </View>
                        </View>
                        {pm.is_default && (
                          <Chip
                            style={styles.defaultChip}
                            textStyle={styles.defaultChipText}
                          >
                            Default
                          </Chip>
                        )}
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              )}

              {/* Add New Payment Method */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>
                    {paymentMethods.length > 0 ? 'Add New Card' : 'Add Payment Method'}
                  </Text>
                  <PaymentMethodForm
                    onSuccess={() => {
                      // Refresh billing data to show new payment method
                      fetchBillingData();
                      // Optionally switch back to overview tab
                      setActiveTab('overview');
                    }}
                  />
                </Card.Content>
              </Card>
            </View>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Invoice History</Text>

                {invoices.length > 0 ? (
                  <View>
                    {invoices.map((invoice) => {
                      const statusColors = getStatusColor(invoice.status);
                      return (
                        <View key={invoice.invoice_id} style={styles.invoiceRow}>
                          <View style={styles.invoiceLeft}>
                            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                            <Text style={styles.invoiceDate}>
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={styles.invoiceRight}>
                            <Text style={styles.invoiceAmount}>${invoice.amount}</Text>
                            <Chip
                              style={[styles.statusChip, { backgroundColor: statusColors.bg }]}
                              textStyle={[styles.statusChipText, { color: statusColors.text }]}
                            >
                              {invoice.status}
                            </Chip>
                            {invoice.invoice_pdf_url && (
                              <Button
                                mode="outlined"
                                onPress={async () => {
                                  // Open PDF in browser (cross-platform)
                                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                                    window.open(invoice.invoice_pdf_url, '_blank');
                                  } else {
                                    await Linking.openURL(invoice.invoice_pdf_url);
                                  }
                                }}
                                compact
                                style={styles.downloadButton}
                              >
                                Download
                              </Button>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No invoices found</Text>
                )}
              </Card.Content>
            </Card>
          )}
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
  header: {
    marginBottom: designTokens.spacing.l,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xxl,
    fontWeight: '700' as const,
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.xs,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  tabsScroll: {
    marginBottom: designTokens.spacing.m,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  tab: {
    paddingVertical: designTokens.spacing.m,
    paddingHorizontal: designTokens.spacing.l,
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
    backgroundColor: '#FFFFFF',
    marginBottom: designTokens.spacing.m,
  },
  cardTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.m,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
  },
  planChip: {
    height: 28,
  },
  planChipText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: designTokens.spacing.xs,
  },
  price: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: designTokens.color.text.heading,
  },
  priceUnit: {
    fontSize: designTokens.typography.fontSize.l,
    color: designTokens.color.text.subtle,
    marginLeft: 4,
  },
  nextBilling: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.m,
  },
  changeButton: {
    borderColor: designTokens.color.brand.primary,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginTop: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    fontSize: designTokens.typography.fontSize.s,
    color: '#92400e',
  },
  paymentMethodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.m,
  },
  cardBrandBox: {
    width: 48,
    height: 32,
    backgroundColor: designTokens.color.brand.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBrandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  cardDetails: {
    flex: 1,
  },
  cardNumber: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  emptyText: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  statsGrid: {
    gap: designTokens.spacing.m,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
  },
  statLabel: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.xs,
  },
  statValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: designTokens.color.text.heading,
  },
  supportCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: designTokens.spacing.m,
  },
  planName: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '700' as const,
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.m,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: designTokens.spacing.m,
  },
  planPrice: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: designTokens.color.text.heading,
  },
  planPriceUnit: {
    fontSize: designTokens.typography.fontSize.l,
    color: designTokens.color.text.subtle,
    marginLeft: 4,
  },
  planPriceCustom: {
    fontSize: designTokens.typography.fontSize.l,
    color: designTokens.color.text.subtle,
  },
  featuresList: {
    marginBottom: designTokens.spacing.l,
  },
  featureItem: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.body,
    marginBottom: designTokens.spacing.xs,
  },
  subscribeButton: {
    marginTop: designTokens.spacing.s,
  },
  trialText: {
    fontSize: designTokens.typography.fontSize.xxs,
    color: designTokens.color.text.subtle,
    textAlign: 'center',
    marginTop: designTokens.spacing.xs,
  },
  paymentMethodRow: {
    marginBottom: designTokens.spacing.m,
    paddingBottom: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  defaultChip: {
    backgroundColor: designTokens.color.accent.green100,
    marginTop: designTokens.spacing.xs,
    alignSelf: 'flex-start',
  },
  defaultChipText: {
    color: designTokens.color.accent.green600,
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.light,
    marginBottom: designTokens.spacing.s,
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: designTokens.spacing.xs,
  },
  invoiceAmount: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  statusChip: {
    height: 24,
    marginBottom: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  downloadButton: {
    borderColor: designTokens.color.brand.primary,
    minWidth: 80,
  },
});

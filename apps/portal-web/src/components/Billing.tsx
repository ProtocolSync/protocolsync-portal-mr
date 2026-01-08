import { useState, useEffect } from 'react';
import { Title } from 'react-admin';
import { Card, CardContent, CardHeader } from './Card';
import { PaymentMethodForm } from './PaymentMethodForm';
import { useUser } from '../contexts/UserContext';
import { Box, Typography, Tabs, Tab, Button, Chip } from '@mui/material';
import { designTokens } from '../design-tokens';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CRow,
  CCol
} from '@coreui/react';
import api from '../api';

interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  display_name: string;
  monthly_price_cents: number;
  monthly_price: number;
  max_sites: number | null;
  max_users_per_site: number | null;
  features: {
    document_storage_gb: string | number;
    ai_queries_per_month: string | number;
    support: string;
    custom_branding?: boolean;
    sso?: boolean;
    custom_contract?: boolean;
    features_list?: string[];
  };
}

interface Subscription {
  subscription_id: number;
  company_id: number;
  plan_id: number;
  plan_name: string;
  display_name: string;
  monthly_price_cents: number;
  monthly_price: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  features: any;
}

interface PaymentMethod {
  payment_method_id: number;
  company_id: number;
  user_id: number;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  created_at: string;
  added_by_name?: string;
  added_by_email?: string;
}

interface Invoice {
  invoice_id: number;
  company_id: number;
  subscription_id: number;
  stripe_invoice_id: string;
  amount_cents: number;
  amount: number;
  status: string;
  invoice_pdf_url: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  paid_at: string | null;
  created_at: string;
}


export const Billing = () => {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'payment' | 'invoices'>('overview');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [stats, setStats] = useState({ activeSites: 0, siteAdmins: 0, activeProtocols: 0 });

  useEffect(() => {
    if (user?.company?.id) {
      fetchPlans();
      fetchSubscription();
      fetchPaymentMethods();
      fetchInvoices();
      fetchStats();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscription/plans');

      if (response.success && response.data?.data && Array.isArray(response.data.data)) {
        // Filter out enterprise and pilot plans (not subscribable - custom pricing only)
        const subscribablePlans = response.data.data.filter((plan: SubscriptionPlan) =>
          plan.plan_name !== 'enterprise' && plan.plan_name !== 'pilot'
        );

        // Sort plans: Starter, Professional, Growth
        const planOrder = ['starter', 'professional', 'growth'];
        const sortedPlans = subscribablePlans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => {
          return planOrder.indexOf(a.plan_name) - planOrder.indexOf(b.plan_name);
        });
        setPlans(sortedPlans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchSubscription = async () => {
    if (!user?.company?.id) return;

    try {
      const response = await api.get(`/companies/${user.company.id}/subscription`);

      if (response.success && response.data?.data) {
        setSubscription(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user?.company?.id) return;

    try {
      const response = await api.get(`/companies/${user.company.id}/payment-methods`);

      if (response.success && response.data?.data && Array.isArray(response.data.data)) {
        setPaymentMethods(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const fetchInvoices = async () => {
    if (!user?.company?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/companies/${user.company.id}/invoices?limit=10`);

      if (response.success && response.data?.data && Array.isArray(response.data.data)) {
        setInvoices(response.data.data);
      }
      setInlineError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setInlineError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.company?.id) return;
    
    try {
      // Fetch sites
      const sitesResponse = await api.get(`/companies/${user.company.id}/sites`);
      const activeSites = sitesResponse.success ? (Array.isArray(sitesResponse.data?.data) ? sitesResponse.data.data : sitesResponse.data?.sites || []).length : 0;

      // Fetch site administrators
      const adminsResponse = await api.get(`/companies/${user.company.id}/site-administrators`);
      const siteAdmins = adminsResponse.success ? (adminsResponse.data?.data || []).length : 0;

      // Fetch protocols
      const protocolsResponse = await api.get(`/companies/${user.company.id}/protocols`);
      const activeProtocols = protocolsResponse.success ? (protocolsResponse.data?.data || []).length : 0;

      setStats({ activeSites, siteAdmins, activeProtocols });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handlePaymentSuccess = () => {
    fetchPaymentMethods();
    setInlineError('Payment method added successfully!');
    setActiveTab('overview');
  };

  const subscribeToPlan = async (planName: string) => {
    if (!user?.company?.id || !user?.id) return;

    // Check if payment method exists for paid plans
    if (planName !== 'enterprise' && paymentMethods.length === 0) {
      setInlineError('Please add a payment method before subscribing');
      setActiveTab('payment');
      return;
    }

    setSubscribing(true);
    setInlineError(null);

    try {
      const response = await api.post(
        `/companies/${user.company.id}/subscription`,
        {
          plan_name: planName,
          requester_role: 'admin',
          user_id: user.id
        }
      );

      if (!response.success) {
        throw new Error(response.data?.message || response.error || 'Failed to activate subscription');
      }

      // Refresh subscription
      await fetchSubscription();
      
      // Navigate to payment tab to add payment method
      setActiveTab('payment');
      
      // Show success message
      const plan = plans.find(p => p.plan_name === planName);
      if (response.data?.data?.status === 'trialing') {
        setInlineError(`Success! You're now on the ${plan?.display_name} plan with a 14-day free trial. Please add a payment method.`);
      } else {
        setInlineError(`Success! You're now subscribed to the ${plan?.display_name} plan.`);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setInlineError(err instanceof Error ? err.message : 'Failed to activate subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const confirmCancelSubscription = async () => {
    if (!user?.company?.id) return;
    setShowCancelModal(false);

    try {
      const response = await api.delete(
        `/companies/${user.company.id}/subscription`,
        {
          body: JSON.stringify({
            requester_role: 'admin',
            cancel_immediately: false
          })
        }
      );

      if (!response.success) {
        throw new Error(response.data?.message || response.error || 'Failed to cancel subscription');
      }

      await fetchSubscription();
      setInlineError('Subscription will be canceled at the end of the billing period');
    } catch (err) {
      console.error('Cancel error:', err);
      setInlineError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);

  const getTierColor = (tier?: string) => {
    if (!tier) {
      return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };
    }
    switch (tier.toLowerCase()) {
      case 'starter':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'essentials':
      case 'professional':
        return { bg: designTokens.color.brand.accentGreen100, text: designTokens.color.brand.primary };
      case 'growth':
        return { bg: designTokens.color.background.focus, text: designTokens.color.brand.primary };
      case 'enterprise':
        return { bg: '#fce7f3', text: '#831843' };
      default:
        return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) {
      return { bg: designTokens.color.background.page, text: designTokens.color.text.subtle };
    }
    switch (status.toLowerCase()) {
      case 'paid':
        return { bg: designTokens.color.brand.accentGreen100, text: designTokens.color.brand.accentGreen700 };
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

  const tierColors = subscription?.plan_name ? getTierColor(subscription.plan_name) : { bg: '#f3f4f6', text: '#374151' };

  if (!user?.company?.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Title title="Billing & Subscription" />
        <Typography>No company information available</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        <Title title="Billing & Subscription" />
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h6" color="text.secondary">
                Loading billing information...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, mx: 'auto', width: '100%' }}>
      <Title title="Billing & Subscription" />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1.5, fontWeight: 'bold' }}>
          Billing & Subscription
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your subscription and payment methods
        </Typography>
      </Box>

      {/* Inline error/success message */}
      {inlineError && (
        <Box sx={{
          mb: 3,
          p: 2,
          bgcolor: inlineError.toLowerCase().includes('success') ? designTokens.color.brand.accentGreen100 : '#fee2e2',
          border: `1px solid ${inlineError.toLowerCase().includes('success') ? designTokens.color.brand.accentGreen500 : designTokens.color.text.error}`,
          borderRadius: designTokens.borderRadius.default,
          color: inlineError.toLowerCase().includes('success') ? designTokens.color.brand.accentGreen900 : designTokens.color.text.error,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography>{inlineError}</Typography>
          <Button
            size="small"
            onClick={() => setInlineError(null)}
            sx={{ minWidth: 'auto', color: 'inherit' }}
          >
            ✕
          </Button>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setInlineError(null);
          }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Plans" value="plans" />
          <Tab 
            label="Payment" 
            value="payment" 
            disabled={!subscription}
            sx={{
              opacity: !subscription ? 0.5 : 1,
              cursor: !subscription ? 'not-allowed' : 'pointer'
            }}
          />
          <Tab 
            label="Invoices" 
            value="invoices" 
            disabled={!subscription}
            sx={{
              opacity: !subscription ? 0.5 : 1,
              cursor: !subscription ? 'not-allowed' : 'pointer'
            }}
          />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>
          {/* Current Subscription */}
          <Card className="w-full">
            <CardHeader>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Current Subscription
              </Typography>
            </CardHeader>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Chip
                      label={subscription?.display_name || 'No Subscription'}
                      sx={{
                        backgroundColor: tierColors.bg,
                        color: tierColors.text,
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {subscription?.status === 'trialing' ? 'Free Trial' : subscription?.status || 'Inactive'}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ${subscription?.monthly_price || 0}
                    <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
                      /mo
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {subscription?.current_period_end 
                      ? `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      : 'No active subscription'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setActiveTab('plans')}
                >
                  {subscription ? 'Change Plan' : 'Start Trial'}
                </Button>
              </Box>
              {subscription && subscription.cancel_at_period_end && (
                <Box sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: `${designTokens.borderRadius.default}`,
                  color: '#92400e'
                }}>
                  ⚠️ Subscription will be canceled on {new Date(subscription.current_period_end).toLocaleDateString()}
                </Box>
              )}
              {subscription && !subscription.cancel_at_period_end && subscription.status !== 'trialing' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Subscription
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="w-full">
            <CardHeader>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Payment Method
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab('payment')}
                >
                  {defaultPaymentMethod ? 'Update Payment' : 'Add Payment Method'}
                </Button>
              </Box>
            </CardHeader>
            <CardContent>
              {defaultPaymentMethod ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 32,
                      bgcolor: 'primary.dark',
                      borderRadius: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    {defaultPaymentMethod.card_brand.toUpperCase()}
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      •••• •••• •••• {defaultPaymentMethod.card_last4}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expires {defaultPaymentMethod.card_exp_month}/{defaultPaymentMethod.card_exp_year}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No payment method on file
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Active Sites</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.activeSites}</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Site Administrators</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.siteAdmins}</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Active Protocols</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.activeProtocols}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <Card className="w-full">
          <CardHeader>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {paymentMethods.length > 0 ? 'Update Payment Method' : 'Add Payment Method'}
            </Typography>
          </CardHeader>
          <CardContent>
            {paymentMethods.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Current Payment Methods</Typography>
                {paymentMethods.map(pm => (
                  <Box key={pm.payment_method_id} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <Box sx={{
                      width: 48,
                      height: 32,
                      bgcolor: 'primary.dark',
                      borderRadius: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      {pm.card_brand.toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        •••• •••• •••• {pm.card_last4}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Expires {pm.card_exp_month}/{pm.card_exp_year}
                      </Typography>
                    </Box>
                    {pm.is_default && (
                      <Chip
                        label="Default"
                        size="small"
                        color="success"
                        sx={{ fontSize: '12px' }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Add New Card</Typography>
            <PaymentMethodForm 
              onSuccess={handlePaymentSuccess}
            />
          </CardContent>
        </Card>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Card className="w-full">
          <CardHeader>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Invoice History
            </Typography>
          </CardHeader>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2 }}>
              {invoices.length > 0 ? invoices.map(invoice => {
                const statusColors = getStatusColor(invoice.status);
                return (
                  <Box
                    key={invoice.invoice_id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1.5
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {invoice.invoice_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ${invoice.amount}
                      </Typography>
                      <Chip
                        label={invoice.status}
                        size="small"
                        sx={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                      {invoice.invoice_pdf_url && (
                        <Button
                          variant="outlined"
                          size="small"
                          href={invoice.invoice_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              }) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2.5 }}>
                  No invoices found
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>
          <Card className="w-full">
            <CardHeader>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Choose Your Plan
              </Typography>
            </CardHeader>
            <CardContent>
            <CRow className="g-3">
              {plans.map(plan => {
                const isCurrentPlan = subscription?.plan_name === plan.plan_name;
                return (
                  <CCol key={plan.plan_id} xs={12} md={6} lg={4}>
                    <Box
                      sx={{
                        border: isCurrentPlan ? `2px solid ${designTokens.color.brand.accentGreen500}` : `1px solid ${designTokens.color.background.focus}`,
                        borderRadius: designTokens.borderRadius.default,
                        p: 3,
                        backgroundColor: isCurrentPlan ? designTokens.color.brand.accentGreen100 : designTokens.color.background.card,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: designTokens.typography.fontWeight.bold, mb: 1 }}>
                        {plan.display_name}
                      </Typography>
                      <Box sx={{ fontSize: designTokens.typography.fontSize.xxl, fontWeight: designTokens.typography.fontWeight.bold, mb: 2 }}>
                        {plan.monthly_price > 0 ? (
                          <>
                            ${plan.monthly_price}
                            <Typography component="span" sx={{ fontSize: designTokens.typography.fontSize.l, color: designTokens.color.text.subtle, fontWeight: designTokens.typography.fontWeight.regular }}>
                              /mo
                            </Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontSize: designTokens.typography.fontSize.l, color: designTokens.color.text.subtle }}>
                            Custom Pricing
                          </Typography>
                        )}
                      </Box>
                      <Box component="ul" sx={{ listStyle: 'none', padding: 0, mb: 3 }}>
                        {plan.features.features_list && plan.features.features_list.map((feature: string, idx: number) => (
                          <Typography key={idx} component="li" sx={{ mb: 1, fontSize: designTokens.typography.fontSize.xs }}>
                            ✓ {feature}
                          </Typography>
                        ))}
                      </Box>
                      <Button
                        onClick={() => subscribeToPlan(plan.plan_name)}
                        disabled={subscribing || isCurrentPlan}
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: isCurrentPlan ? designTokens.color.text.subtle : subscribing ? designTokens.color.background.focus : designTokens.color.brand.accentGreen500,
                          color: designTokens.color.text.inverse,
                          fontWeight: designTokens.typography.fontWeight.semibold,
                          '&:hover': {
                            backgroundColor: isCurrentPlan ? designTokens.color.text.subtle : subscribing ? designTokens.color.background.focus : designTokens.color.brand.accentGreen700
                          },
                          '&:disabled': {
                            backgroundColor: designTokens.color.text.subtle,
                            color: designTokens.color.text.inverse
                          }
                        }}
                      >
                        {isCurrentPlan ? 'Current Plan' : subscribing ? 'Processing...' : 'Subscribe'}
                      </Button>
                      {plan.plan_name !== 'enterprise' && plan.monthly_price > 0 && !subscription && (
                        <Typography sx={{ fontSize: designTokens.typography.fontSize.xxs, color: designTokens.color.text.subtle, mt: 1, textAlign: 'center' }}>
                          14-day free trial
                        </Typography>
                      )}
                    </Box>
                  </CCol>
                );
              })}
            </CRow>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      <CModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Cancel Subscription?</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCancelModal(false)}>
            Keep Subscription
          </CButton>
          <CButton color="danger" onClick={confirmCancelSubscription}>
            Cancel Subscription
          </CButton>
        </CModalFooter>
      </CModal>
    </Box>
  );
};

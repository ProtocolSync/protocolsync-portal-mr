import { ApiClient, ApiResponse } from '../api/ApiClient';

export interface Subscription {
  subscription_id: number;
  plan_name: string;
  display_name: string;
  monthly_price: number;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface PaymentMethod {
  payment_method_id: number;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

export interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  display_name: string;
  monthly_price: number;
  features: {
    features_list?: string[];
  };
}

export interface BillingStats {
  activeSites: number;
  siteAdmins: number;
  activeTrials: number;
}

export interface Invoice {
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

export class BillingService {
  constructor(private apiClient: ApiClient) {}

  async getSubscription(companyId: number): Promise<Subscription | null> {
    const response = await this.apiClient.get(`/companies/${companyId}/subscription`);
    if (response.success && response.data) {
      const data = (response.data as any).data || response.data;
      return data;
    }
    return null;
  }

  async getPaymentMethods(companyId: number): Promise<PaymentMethod[]> {
    const response = await this.apiClient.get(`/companies/${companyId}/payment-methods`);
    if (response.success && response.data) {
      const data = (response.data as any).data || response.data;
      return Array.isArray(data) ? data : [];
    }
    return [];
  }

  async createSetupIntent(companyId: number, userId: number): Promise<ApiResponse<any>> {
    const response = await this.apiClient.post(`/companies/${companyId}/payment/setup-intent`, {
      requester_role: 'admin',
      user_id: userId
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create setup intent');
    }

    const data = (response.data as any).data || response.data;
    const clientSecret = data.client_secret;

    if (!clientSecret) {
      throw new Error('No client secret received');
    }

    return clientSecret;
  }

  async savePaymentMethod(
    companyId: number,
    userId: number,
    paymentMethodId: string,
    setAsDefault: boolean = true
  ): Promise<void> {
    const response = await this.apiClient.post(`/companies/${companyId}/payment-methods`, {
      payment_method_id: paymentMethodId,
      user_id: userId,
      requester_role: 'admin',
      set_as_default: setAsDefault
    });

    if (!response.success) {
      throw new Error('Failed to save payment method');
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.apiClient.get('/subscription/plans');
    if (response.success && response.data) {
      const plansData = (response.data as any).data || response.data;
      if (Array.isArray(plansData)) {
        // Filter out enterprise and pilot plans (not subscribable)
        const subscribablePlans = plansData.filter((plan: SubscriptionPlan) =>
          plan.plan_name !== 'enterprise' && plan.plan_name !== 'pilot'
        );
        // Sort: Starter, Professional, Growth
        const planOrder = ['starter', 'professional', 'growth'];
        return subscribablePlans.sort((a: SubscriptionPlan, b: SubscriptionPlan) =>
          planOrder.indexOf(a.plan_name) - planOrder.indexOf(b.plan_name)
        );
      }
    }
    return [];
  }

  async getBillingStats(companyId: number): Promise<BillingStats> {
    try {
      // Fetch sites
      const sitesResponse = await this.apiClient.get(`/companies/${companyId}/sites`);
      const sitesData = sitesResponse.success && sitesResponse.data ?
        ((sitesResponse.data as any).data || (sitesResponse.data as any).sites || []) : [];
      const activeSites = Array.isArray(sitesData) ? sitesData.length : 0;

      // Fetch site administrators
      const adminsResponse = await this.apiClient.get(`/companies/${companyId}/site-administrators`);
      const adminsData = adminsResponse.success && adminsResponse.data ?
        ((adminsResponse.data as any).data || []) : [];
      const siteAdmins = Array.isArray(adminsData) ? adminsData.length : 0;

      // Fetch protocols (trials)
      const trialsResponse = await this.apiClient.get(`/companies/${companyId}/protocols`);
      const trialsData = trialsResponse.success && trialsResponse.data ?
        ((trialsResponse.data as any).data || []) : [];
      const activeTrials = Array.isArray(trialsData) ? trialsData.length : 0;

      return { activeSites, siteAdmins, activeTrials };
    } catch (err) {
      console.error('Error fetching billing stats:', err);
      return { activeSites: 0, siteAdmins: 0, activeTrials: 0 };
    }
  }

  async getInvoices(companyId: number, limit: number = 10): Promise<Invoice[]> {
    const response = await this.apiClient.get(`/companies/${companyId}/invoices?limit=${limit}`);
    if (response.success && response.data) {
      const data = (response.data as any).data || response.data;
      return Array.isArray(data) ? data : [];
    }
    return [];
  }

  async subscribeToPlan(companyId: number, userId: number, planName: string): Promise<any> {
    const response = await this.apiClient.post(`/companies/${companyId}/subscription`, {
      plan_name: planName,
      requester_role: 'admin',
      user_id: userId
    });

    if (!response.success) {
      throw new Error((response.data as any)?.message || response.error || 'Failed to activate subscription');
    }

    return (response.data as any)?.data || response.data;
  }

  async getAllBillingData(companyId: number) {
    const [subscription, paymentMethods, plans, stats, invoices] = await Promise.all([
      this.getSubscription(companyId),
      this.getPaymentMethods(companyId),
      this.getSubscriptionPlans(),
      this.getBillingStats(companyId),
      this.getInvoices(companyId),
    ]);

    return {
      subscription,
      paymentMethods,
      plans,
      stats,
      invoices,
    };
  }
}

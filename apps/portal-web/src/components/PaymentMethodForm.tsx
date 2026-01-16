import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { billingService } from '../apiClient';

interface PaymentMethodFormProps {
  onSuccess: () => void;
}

export const PaymentMethodForm = ({ onSuccess }: PaymentMethodFormProps) => {
  const { user } = useAuth();
  const [cardholderName, setCardholderName] = useState(user?.displayName || '');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [cardElementReady, setCardElementReady] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Load Stripe.js dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => setStripeLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user?.company?.id || !user?.id) {
      setError('User information not available');
      return;
    }

    if (!cardholderName.trim()) {
      setError('Please enter cardholder name');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create setup intent using BillingService
      const clientSecret = await billingService.createSetupIntent(
        parseInt(user.company.id),
        parseInt(user.id.toString())
      );

      // Step 2: Confirm card setup with Stripe (use the same instance)
      if (!stripeInstance) {
        throw new Error('Stripe not initialized');
      }

      // @ts-ignore
      const cardElement = window.cardElement;

      if (!cardElement) {
        throw new Error('Card element not initialized');
      }

      const { setupIntent, error: stripeError } = await stripeInstance.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Card validation failed');
      }

      if (!setupIntent?.payment_method) {
        throw new Error('No payment method returned');
      }

      // Step 3: Save payment method using BillingService
      await billingService.savePaymentMethod(
        parseInt(user.company.id),
        parseInt(user.id.toString()),
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
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment method');
      setProcessing(false);
    }
  };

  // Initialize Stripe Elements when script loads
  useEffect(() => {
    if (stripeLoaded && !cardElementReady) {
      // @ts-ignore
      const stripe = window.Stripe('pk_test_51SZgyVIDe9lJOpslHSU9alzFtESzV34EwnIfB9mdZtJDtINMslzjUvnN8I9zYs0Iv3Qr4dRr55iBjLIki9jdzem400LpZFanJ3');
      setStripeInstance(stripe); // Store the instance
      
      const elements = stripe.elements();
      const cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#374151',
            '::placeholder': {
              color: '#9ca3af',
            },
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          invalid: {
            color: '#dc2626',
          },
        },
      });
      
      const cardElementDiv = document.getElementById('card-element');
      if (cardElementDiv) {
        cardElement.mount('#card-element');
        // @ts-ignore
        window.cardElement = cardElement;
        setCardElementReady(true);
      }
    }
  }, [stripeLoaded, cardElementReady]);

  if (!stripeLoaded) {
    return (
      <div className="p-5 text-center">
        <p className="text-gray-400">Loading payment form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-5 p-3 bg-red-100 border border-red-500 rounded-lg text-red-900 text-sm font-medium">
          ✕ {error}
        </div>
      )}

      <div className="mb-5">
        <label
          htmlFor="cardholderName"
          className="block text-sm font-semibold mb-2 text-gray-700"
        >
          Cardholder Name
        </label>
        <input
          id="cardholderName"
          type="text"
          required
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-base"
          placeholder={user?.displayName || 'Cardholder Name'}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-gray-700">
          Card Information
        </label>
        <div
          id="card-element"
          className="p-3 border border-gray-300 rounded-md bg-white"
        />
      </div>

      <div className="flex items-center gap-3 mb-5 p-3 bg-green-50 border border-green-300 rounded-md">
        <span className="text-xl">🔒</span>
        <div>
          <p className="text-sm font-semibold m-0 mb-1 text-green-900">
            Secure Payment
          </p>
          <p className="text-xs text-green-800 m-0">
            Your payment information is encrypted and secured by Stripe. We never store your card details.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 cursor-pointer accent-brand-accentGreen"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <a
              href={`${import.meta.env.VITE_WEBSITE_URL}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline text-brand-accentGreen"
            >
              Terms of Service
            </a>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={processing || !cardElementReady || !agreedToTerms}
        className={`
          w-full py-4 px-6 rounded border-none text-base font-semibold text-text-inverse
          transition-all duration-200 ease-in-out
          ${processing || !cardElementReady || !agreedToTerms
            ? 'bg-text-subtle cursor-not-allowed shadow-none'
            : 'bg-brand-accentGreen cursor-pointer shadow-default hover:bg-brand-accentGreen-700 hover:shadow-lifted'
          }
        `}
      >
        {processing ? 'Processing...' : 'Save Payment Method'}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        By providing your card information, you authorize us to charge this card for future payments in accordance with our terms.
      </p>
    </form>
  );
};

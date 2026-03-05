// Pricing.jsx
// Subscription pricing page with Paystack payment integration.
// Payment initialization goes to Netlify (initialize-payment function),
// NOT Firebase — Paystack API calls are outbound HTTP blocked on Spark plan.

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Check, AlertCircle } from 'lucide-react';
import './Pricing.css';

// ─── Plan definitions ─────────────────────────────────────────────────────────

const TIERS = {
  free: {
    name:        'Free',
    monthlyPrice: null,
    yearlyPrice:  null,
    displayPrice: { monthly: '₦0', yearly: '₦0' },
    description: 'Perfect for getting started',
    features: [
      '5 posts / month',
      '1 social media platform',
      '1 business profile',
      'Basic AI content generation',
      'Community support',
    ],
    cta:      'Current Plan',
    disabled: true,
  },
  pro: {
    name:        'Pro',
    monthlyPrice: 9999,
    yearlyPrice:  99999,
    displayPrice: { monthly: '₦9,999', yearly: '₦99,999' },
    description: 'For growing businesses',
    features: [
      '100 posts / month',
      '5 social platforms',
      'Unlimited businesses',
      'Advanced AI content',
      'Multi-platform scheduling',
      'YouTube integration',
      'Priority support',
    ],
    cta:      'Upgrade Now',
    disabled: false,
  },
  enterprise: {
    name:        'Enterprise',
    monthlyPrice: 29999,
    yearlyPrice:  299999,
    displayPrice: { monthly: '₦29,999', yearly: '₦299,999' },
    description: 'For agencies & teams',
    features: [
      'Unlimited posts',
      'Unlimited platforms',
      'Team collaboration',
      'Custom integrations',
      'Advanced analytics',
      'API access',
      'Dedicated support',
      'White-label options',
    ],
    cta:      'Contact Sales',
    disabled: false,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

function Pricing() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser }               = useAuth();
  const [currentTier, setCurrentTier] = useState('free');
  const [billing, setBilling]         = useState('monthly');
  const [loading, setLoading]         = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null); // which plan button is spinning
  const [error, setError]             = useState('');

  // ─── Load user's current tier from Firestore ────────────────────────────────

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          setCurrentTier(snap.data().subscriptionTier || 'free');
        }
      } catch (err) {
        console.error('Error fetching user tier:', err);
      }
    })();
  }, [currentUser]);

  // ─── Handle upgrade ──────────────────────────────────────────────────────────

  const handleUpgrade = async (plan) => {
    if (!currentUser) { alert('Please sign in first'); return; }
    if (plan === 'free') return;
    if (plan === currentTier) return; // already on this plan

    // Enterprise → contact sales instead of payment flow
    if (plan === 'enterprise') {
      window.location.href = 'mailto:sales@marketmind.app?subject=Enterprise Plan Enquiry';
      return;
    }

    setLoadingPlan(plan);
    setError('');

    try {
      // Call Netlify function — NOT Firebase (outbound HTTP blocked on Spark)
      const response = await fetch('/.netlify/functions/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:   currentUser.email,
          plan,
          billing,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack hosted payment page
      window.location.href = data.authorizationUrl;

    } catch (err) {
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const isCurrentPlan = (key) => key === currentTier;

  const getButtonLabel = (key, tier) => {
    if (isCurrentPlan(key))    return 'Current Plan';
    if (loadingPlan === key)   return 'Processing...';
    return tier.cta;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="content-area">
          <div className="pricing-container">

            {/* Header */}
            <div className="pricing-header">
              <h1>Simple, Transparent Pricing</h1>
              <p>Choose the perfect plan for your business growth</p>
            </div>

            {/* Billing toggle */}
            <div className="billing-toggle">
              <button
                className={`toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
                onClick={() => setBilling('monthly')}
              >
                Monthly
              </button>
              <button
                className={`toggle-btn ${billing === 'yearly' ? 'active' : ''}`}
                onClick={() => setBilling('yearly')}
              >
                Yearly
                <span className="badge">Save 17%</span>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="error-box">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Pricing cards */}
            <div className="pricing-grid">
              {Object.entries(TIERS).map(([key, tier]) => (
                <div
                  key={key}
                  className={[
                    'pricing-card',
                    isCurrentPlan(key) ? 'current' : '',
                    key === 'pro'      ? 'featured' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {key === 'pro' && (
                    <div className="featured-badge">Most Popular</div>
                  )}

                  <h3>{tier.name}</h3>
                  <p className="description">{tier.description}</p>

                  <div className="price">
                    <span className="amount">{tier.displayPrice[billing]}</span>
                    <span className="period">/month</span>
                  </div>

                  {billing === 'yearly' && tier.yearlyPrice && (
                    <p className="yearly-note">Billed as ₦{tier.yearlyPrice.toLocaleString()} / year</p>
                  )}

                  <button
                    className={[
                      'upgrade-btn',
                      isCurrentPlan(key)  ? 'disabled'  : '',
                      loadingPlan === key  ? 'loading'   : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleUpgrade(key)}
                    disabled={isCurrentPlan(key) || loadingPlan !== null}
                  >
                    {getButtonLabel(key, tier)}
                    {loadingPlan === key && <span className="spinner" />}
                  </button>

                  <div className="features">
                    <h4>Features:</h4>
                    <ul>
                      {tier.features.map((feature, idx) => (
                        <li key={idx}>
                          <Check size={18} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="pricing-faq">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-grid">
                <div className="faq-item">
                  <h4>Can I change plans anytime?</h4>
                  <p>Yes! Upgrade or downgrade at any time. Billing adjusts from the next cycle.</p>
                </div>
                <div className="faq-item">
                  <h4>What payment methods do you accept?</h4>
                  <p>All major methods via Paystack: cards, bank transfers, USSD, and mobile money.</p>
                </div>
                <div className="faq-item">
                  <h4>Is there a free trial?</h4>
                  <p>Yes — start on our Free plan, no credit card required. Upgrade when ready.</p>
                </div>
                <div className="faq-item">
                  <h4>What happens when I exceed my limits?</h4>
                  <p>You'll see a prompt to upgrade. Existing content and accounts are never deleted.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Pricing;
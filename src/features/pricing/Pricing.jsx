// Pricing.jsx
// Premium pricing page with Paystack payment integration

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Check, Zap } from 'lucide-react';
import './Pricing.css';

const TIERS = {
  free: {
    name: 'Free',
    price: '₦0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '10 posts/month',
      '5 research/month',
      '1 business profile',
      'Basic content generation',
      'Community support'
    ],
    cta: 'Current Plan',
    disabled: true
  },
  pro: {
    name: 'Pro',
    price: '₦9,999',
    period: '/month',
    description: 'For growing businesses',
    features: [
      '100 posts/month',
      '50 research/month',
      'Unlimited businesses',
      'Advanced AI content',
      'Multi-platform scheduling',
      'YouTube integration',
      'Priority support'
    ],
    cta: 'Upgrade Now',
    monthlyPrice: 9999,
    yearlyPrice: 99999
  },
  enterprise: {
    name: 'Enterprise',
    price: '₦29,999',
    period: '/month',
    description: 'For agencies & teams',
    features: [
      'Unlimited posts',
      'Unlimited research',
      'Team collaboration',
      'Custom integrations',
      'Advanced analytics',
      'API access',
      'Dedicated support',
      'White-label options'
    ],
    cta: 'Contact Sales',
    monthlyPrice: 29999,
    yearlyPrice: 299999
  }
};

function Pricing() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [currentTier, setCurrentTier] = useState('free');
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user's current tier
    if (currentUser) {
      // Load from Firestore
      fetchUserTier();
    }
  }, [currentUser]);

  const fetchUserTier = async () => {
    // Will implement after Cloud Functions are deployed
  };

  const handleUpgrade = async (plan) => {
    if (!currentUser) {
      alert('Please sign in first');
      return;
    }

    if (plan === 'free') return;

    setLoading(true);
    setError('');

    try {
      // Call Cloud Function to initialize payment
      const initializePayment = httpsCallable(functions, 'initializePayment');
      const result = await initializePayment({
        plan,
        billing
      });

      // Redirect to Paystack payment page
      if (result.data.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

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

            {/* Billing Toggle */}
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

            {/* Error Message */}
            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            {/* Pricing Cards */}
            <div className="pricing-grid">
              {Object.entries(TIERS).map(([key, tier]) => (
                <div key={key} className={`pricing-card ${key === currentTier ? 'current' : ''} ${key === 'pro' ? 'featured' : ''}`}>
                  {key === 'pro' && <div className="featured-badge">Most Popular</div>}
                  
                  <h3>{tier.name}</h3>
                  <p className="description">{tier.description}</p>
                  
                  <div className="price">
                    <span className="amount">{tier.price}</span>
                    <span className="period">{tier.period}</span>
                  </div>

                  <button 
                    className={`upgrade-btn ${tier.disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`}
                    onClick={() => handleUpgrade(key)}
                    disabled={tier.disabled || loading}
                  >
                    {tier.cta}
                    {loading && <span className="spinner"></span>}
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

            {/* FAQ Section */}
            <div className="pricing-faq">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-grid">
                <div className="faq-item">
                  <h4>Can I change plans anytime?</h4>
                  <p>Yes! You can upgrade or downgrade your plan at any time. Your billing will be adjusted accordingly.</p>
                </div>
                <div className="faq-item">
                  <h4>What payment methods do you accept?</h4>
                  <p>We accept all major payment methods through Paystack: cards, bank transfers, USSD, and mobile money.</p>
                </div>
                <div className="faq-item">
                  <h4>Is there a free trial?</h4>
                  <p>Yes! Start with our Free plan and upgrade whenever you're ready. No credit card required.</p>
                </div>
                <div className="faq-item">
                  <h4>What happens when I exceed my limits?</h4>
                  <p>You'll receive a notification. Upgrade to a higher plan to continue generating content.</p>
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

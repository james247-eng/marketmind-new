// Pricing.jsx
// Dedicated pricing page with FAQ

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { CheckCircle2, X, Plus, Minus } from 'lucide-react';
import './Pricing.css';

function Pricing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly
  const [openFAQ, setOpenFAQ] = useState(null);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for getting started",
      features: [
        { text: "10 AI-generated posts per month", included: true },
        { text: "2 social platforms", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "Advanced analytics", included: false },
        { text: "Team collaboration", included: false },
        { text: "Priority support", included: false }
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: { monthly: 29, yearly: 24 },
      description: "For professionals and growing businesses",
      features: [
        { text: "100 AI-generated posts per month", included: true },
        { text: "Unlimited social platforms", included: true },
        { text: "Advanced analytics & reports", included: true },
        { text: "Priority email & chat support", included: true },
        { text: "Custom brand voice training", included: true },
        { text: "Team collaboration (5 members)", included: true },
        { text: "Content calendar", included: true }
      ],
      cta: "Start 14-Day Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: { monthly: 99, yearly: 82 },
      description: "For agencies and large organizations",
      features: [
        { text: "Unlimited AI-generated posts", included: true },
        { text: "Unlimited social platforms", included: true },
        { text: "White-label analytics reports", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "API access", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Custom integrations", included: true },
        { text: "SLA guarantee (99.9% uptime)", included: true }
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Can I switch plans at any time?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll pro-rate the difference."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for Enterprise plans."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! Pro and Enterprise plans come with a 14-day free trial. No credit card required. The Free plan is available forever with no trial needed."
    },
    {
      question: "What happens when I reach my post limit?",
      answer: "You'll receive a notification when you're close to your limit. You can upgrade your plan or wait until next month when your quota resets."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime. Your account will remain active until the end of your current billing period. No questions asked."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level AES-256 encryption, comply with GDPR and CCPA regulations, and never sell your data to third parties."
    },
    {
      question: "Can I add more team members?",
      answer: "Yes! Pro plans include 5 team members. You can add more for $5/member/month. Enterprise plans have unlimited team members."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <>
      <SEO 
        title="Pricing - Market Mind | Affordable Social Media Marketing Plans"
        description="Choose the perfect plan for your business. Start free, upgrade anytime. Pro at $29/mo, Enterprise at $99/mo. 14-day free trial, no credit card required."
        keywords="social media pricing, marketing tool pricing, affordable social media management, free social media tool, pro plan, enterprise plan"
      />

      <div className="pricing-page">
        <Navbar />

        {/* Hero */}
        <section className="pricing-hero">
          <div className="pricing-hero-container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1>Simple, Transparent Pricing</h1>
              <p>Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>
              
              {/* Billing Toggle */}
              <div className="billing-toggle">
                <button
                  className={billingCycle === 'monthly' ? 'active' : ''}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={billingCycle === 'yearly' ? 'active' : ''}
                  onClick={() => setBillingCycle('yearly')}
                >
                  Yearly
                  <span className="save-badge">Save 17%</span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pricing-cards-section">
          <div className="pricing-cards-container">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                className={`pricing-plan-card ${plan.popular ? 'popular' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.popular && <div className="popular-label">Most Popular</div>}
                
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price[billingCycle]}</span>
                  <span className="period">/{billingCycle === 'monthly' ? 'mo' : 'mo billed yearly'}</span>
                </div>
                <p className="plan-description">{plan.description}</p>

                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={feature.included ? 'included' : 'not-included'}>
                      {feature.included ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <X size={20} />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`}
                  onClick={() => navigate('/signup')}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="faq-container">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{faq.question}</span>
                    {openFAQ === index ? <Minus size={20} /> : <Plus size={20} />}
                  </button>
                  {openFAQ === index && (
                    <motion.div
                      className="faq-answer"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <p>{faq.answer}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Pricing;
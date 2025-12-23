// LandingPage.jsx
// Premium landing page with full SEO optimization

import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Clock, 
  Shield, 
  Users,
  Calendar,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Star,
  Quote
} from 'lucide-react';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI Content Generation",
      description: "Generate engaging social media posts in seconds using advanced AI. No more writer's block.",
      color: "#8B5CF6"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Schedule posts across all platforms at optimal times. Set it and forget it.",
      color: "#3B82F6"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track performance with detailed insights. Know what works and optimize your strategy.",
      color: "#10B981"
    },
    {
      icon: Zap,
      title: "Multi-Platform Support",
      description: "Manage Facebook, Instagram, Twitter, TikTok, and YouTube from one dashboard.",
      color: "#F59E0B"
    },
    {
      icon: Clock,
      title: "Save 10+ Hours Weekly",
      description: "Automate repetitive tasks and focus on growing your business instead.",
      color: "#EF4444"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption keeps your data and accounts 100% secure.",
      color: "#6366F1"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechFlow Solutions",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      content: "Market Mind transformed our social media strategy. We've seen a 300% increase in engagement and saved over 15 hours per week. The AI content generator is incredibly accurate.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "GrowthHub Agency",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      content: "As an agency managing 20+ clients, Market Mind is a game-changer. The scheduling feature alone has doubled our productivity. Our clients love the analytics reports.",
      rating: 5
    },
    {
      name: "Aisha Okonkwo",
      role: "Small Business Owner",
      company: "Bella's Boutique",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      content: "I was struggling to maintain consistent posting. Market Mind made it so easy! Now I post daily across 4 platforms without stress. My sales have increased by 45%.",
      rating: 5
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Users" },
    { value: "2M+", label: "Posts Generated" },
    { value: "98%", label: "Customer Satisfaction" },
    { value: "15hrs", label: "Average Time Saved Weekly" }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for testing the waters",
      features: [
        "10 AI-generated posts/month",
        "2 social platforms",
        "Basic analytics",
        "Email support"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For serious content creators",
      features: [
        "100 AI-generated posts/month",
        "Unlimited platforms",
        "Advanced analytics",
        "Priority support",
        "Custom brand voice",
        "Team collaboration"
      ],
      cta: "Start 14-Day Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      description: "For agencies and large teams",
      features: [
        "Unlimited posts",
        "Unlimited platforms",
        "White-label reports",
        "Dedicated account manager",
        "API access",
        "Custom integrations",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <>
      <SEO 
        title="Market Mind - AI Social Media Marketing Platform | Automate Your Content"
        description="Automate social media marketing with AI. Generate content, schedule posts to Facebook, Instagram, Twitter, TikTok & YouTube. Real-time analytics. Free trial!"
        keywords="AI social media tool, content automation, social media scheduler, Instagram scheduler, Facebook post scheduler, TikTok marketing, YouTube marketing, social media analytics, AI content writer, marketing automation software"
      />

      <div className="landing-page">
        <Navbar />

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <motion.div 
              className="hero-content"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="hero-badge">
                <Sparkles size={16} />
                <span>AI-Powered Social Media Marketing</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="hero-title">
                Grow Your Business with
                <span className="gradient-text"> AI-Powered </span>
                Social Media Marketing
              </motion.h1>

              <motion.p variants={fadeInUp} className="hero-description">
                Generate engaging content, schedule posts across all platforms, and track performance—all in one place. Save 10+ hours every week and grow your audience 3x faster.
              </motion.p>

              <motion.div variants={fadeInUp} className="hero-cta">
                <button onClick={() => navigate('/signup')} className="btn-hero-primary">
                  Start Free Trial
                  <ArrowRight size={20} />
                </button>
                <button onClick={() => navigate('/features')} className="btn-hero-secondary">
                  See How It Works
                </button>
              </motion.div>

              <motion.div variants={fadeInUp} className="hero-proof">
                <div className="proof-item">
                  <CheckCircle2 size={18} />
                  <span>No credit card required</span>
                </div>
                <div className="proof-item">
                  <CheckCircle2 size={18} />
                  <span>14-day free trial</span>
                </div>
                <div className="proof-item">
                  <CheckCircle2 size={18} />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="hero-image"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&q=80" 
                alt="Happy woman using Market Mind social media marketing platform on mobile phone"
                loading="eager"
              />
              <div className="hero-image-overlay">
                <div className="floating-card card-1">
                  <TrendingUp size={20} />
                  <span>+245% Engagement</span>
                </div>
                <div className="floating-card card-2">
                  <Users size={20} />
                  <span>15K New Followers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-container">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section" id="features">
          <div className="section-container">
            <motion.div 
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2>Everything You Need to Dominate Social Media</h2>
              <p>Powerful features designed to save time and grow your audience</p>
            </motion.div>

            <motion.div 
              className="features-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card"
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <div className="feature-icon" style={{ backgroundColor: `${feature.color}15` }}>
                    <feature.icon size={28} style={{ color: feature.color }} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="section-container">
            <motion.div 
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2>Get Started in 3 Simple Steps</h2>
              <p>From signup to your first post in under 5 minutes</p>
            </motion.div>

            <div className="steps-container">
              {[
                {
                  step: "1",
                  title: "Connect Your Accounts",
                  description: "Link your Facebook, Instagram, Twitter, TikTok, and YouTube accounts in one click. Secure OAuth authentication."
                },
                {
                  step: "2",
                  title: "Generate Content with AI",
                  description: "Tell our AI what you want to post. It generates engaging, on-brand content instantly. Edit or use as-is."
                },
                {
                  step: "3",
                  title: "Schedule & Analyze",
                  description: "Schedule posts at optimal times across all platforms. Track performance with real-time analytics."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="step-card"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="step-number">{item.step}</div>
                  <div className="step-content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="section-container">
            <motion.div 
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2>Trusted by 50,000+ Businesses Worldwide</h2>
              <p>See what our customers are saying about Market Mind</p>
            </motion.div>

            <motion.div 
              className="testimonials-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="testimonial-card"
                  variants={fadeInUp}
                >
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                  <Quote className="quote-icon" size={32} />
                  <p className="testimonial-content">{testimonial.content}</p>
                  <div className="testimonial-author">
                    <img src={testimonial.image} alt={testimonial.name} loading="lazy" />
                    <div>
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing-section" id="pricing">
          <div className="section-container">
            <motion.div 
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2>Simple, Transparent Pricing</h2>
              <p>Choose the plan that fits your business needs</p>
            </motion.div>

            <motion.div 
              className="pricing-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  <h3>{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="price-amount">{plan.price}</span>
                    <span className="price-period">/{plan.period}</span>
                  </div>
                  <p className="pricing-description">{plan.description}</p>
                  <ul className="pricing-features">
                    {plan.features.map((feature, i) => (
                      <li key={i}>
                        <CheckCircle2 size={18} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={`pricing-cta ${plan.popular ? 'primary' : 'secondary'}`}
                    onClick={() => navigate('/signup')}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta-section">
          <motion.div 
            className="cta-container"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Transform Your Social Media?</h2>
            <p>Join 50,000+ businesses using Market Mind to grow their audience and save time</p>
            <div className="cta-buttons">
              <button onClick={() => navigate('/signup')} className="btn-cta-primary">
                Start Your Free Trial
                <ArrowRight size={20} />
              </button>
              <button onClick={() => navigate('/features')} className="btn-cta-secondary">
                View All Features
              </button>
            </div>
            <p className="cta-note">No credit card required • 14-day free trial • Cancel anytime</p>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default LandingPage;
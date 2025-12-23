// Features.jsx
// Detailed features page with SEO

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { 
  Sparkles, 
  Calendar, 
  BarChart3, 
  Zap, 
  Users, 
  Shield,
  Globe,
  Brain,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import './Features.css';

function Features() {
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const detailedFeatures = [
    {
      icon: Brain,
      title: "Advanced AI Content Generation",
      description: "Our AI understands your brand voice and creates authentic, engaging content that resonates with your audience. No more staring at blank screens.",
      benefits: [
        "Generate posts in 30+ languages",
        "Maintains consistent brand voice",
        "Adapts tone for each platform",
        "Includes relevant hashtags automatically"
      ],
      color: "#8B5CF6"
    },
    {
      icon: Calendar,
      title: "Smart Post Scheduling",
      description: "Schedule unlimited posts across all platforms. Our AI suggests optimal posting times based on your audience engagement patterns.",
      benefits: [
        "Bulk schedule up to 100 posts at once",
        "AI-powered best time recommendations",
        "Automatic timezone adjustments",
        "Queue management and draft saving"
      ],
      color: "#3B82F6"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics Dashboard",
      description: "Track every metric that matters. See what's working, identify trends, and make data-driven decisions to grow your audience.",
      benefits: [
        "Cross-platform performance comparison",
        "Engagement rate tracking",
        "Follower growth analytics",
        "Exportable PDF reports"
      ],
      color: "#10B981"
    },
    {
      icon: Globe,
      title: "Multi-Platform Management",
      description: "Manage Facebook, Instagram, Twitter, TikTok, and YouTube from one unified dashboard. No more juggling multiple apps.",
      benefits: [
        "Single login for all platforms",
        "Unified content calendar",
        "Cross-posting with platform optimization",
        "Centralized comment management"
      ],
      color: "#F59E0B"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work seamlessly with your team. Assign roles, approve content, and maintain brand consistency across all channels.",
      benefits: [
        "Role-based permissions (Admin, Editor, Viewer)",
        "Content approval workflows",
        "Team activity logs",
        "Client access management"
      ],
      color: "#EF4444"
    },
    {
      icon: ImageIcon,
      title: "Media Library & Editor",
      description: "Store, organize, and edit images and videos. Built-in tools to resize, crop, and optimize media for each platform.",
      benefits: [
        "10GB cloud storage included",
        "Automatic image resizing per platform",
        "Video trimming and compression",
        "Stock photo integration"
      ],
      color: "#EC4899"
    },
    {
      icon: Zap,
      title: "Automation & Workflows",
      description: "Set up automated posting rules, recycling evergreen content, and trigger-based actions to save hours every week.",
      benefits: [
        "Auto-repost high-performing content",
        "RSS feed auto-posting",
        "Conditional scheduling rules",
        "Bulk actions and templates"
      ],
      color: "#6366F1"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Your data and social accounts are protected with bank-level encryption, 2FA, and compliance with global data regulations.",
      benefits: [
        "AES-256 encryption",
        "Two-factor authentication",
        "GDPR & CCPA compliant",
        "Regular security audits"
      ],
      color: "#14B8A6"
    }
  ];

  const platforms = [
    { name: "Facebook", icon: "📘", description: "Pages, Groups, and Personal Profiles" },
    { name: "Instagram", icon: "📷", description: "Feed, Stories, and Reels" },
    { name: "Twitter/X", icon: "🐦", description: "Tweets and Threads" },
    { name: "TikTok", icon: "🎵", description: "Videos and Challenges" },
    { name: "YouTube", icon: "▶️", description: "Videos, Shorts, and Community" }
  ];

  return (
    <>
      <SEO 
        title="Features - Market Mind | AI Social Media Marketing Tools"
        description="Explore Market Mind's powerful features: AI content generation, smart scheduling, real-time analytics, multi-platform management, team collaboration & more."
        keywords="social media features, AI content tools, post scheduling, social media analytics, team collaboration, multi-platform management, content calendar"
      />

      <div className="features-page">
        <Navbar />

        {/* Hero Section */}
        <section className="features-hero">
          <div className="features-hero-container">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="features-hero-content"
            >
              <h1>Everything You Need to Master Social Media</h1>
              <p>Powerful tools designed to save you time, grow your audience, and make data-driven decisions</p>
            </motion.div>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="platforms-section">
          <div className="section-container">
            <h2>Works With All Major Platforms</h2>
            <div className="platforms-grid">
              {platforms.map((platform, index) => (
                <motion.div
                  key={index}
                  className="platform-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="platform-icon">{platform.icon}</span>
                  <h3>{platform.name}</h3>
                  <p>{platform.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="detailed-features-section">
          <div className="section-container">
            {detailedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="detailed-feature"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="feature-visual">
                  <div className="feature-icon-large" style={{ backgroundColor: `${feature.color}15` }}>
                    <feature.icon size={48} style={{ color: feature.color }} />
                  </div>
                </div>
                <div className="feature-details">
                  <h3>{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <ul className="feature-benefits">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i}>
                        <CheckCircle2 size={20} style={{ color: feature.color }} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="features-cta">
          <motion.div
            className="cta-box"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Experience All These Features?</h2>
            <p>Start your 14-day free trial. No credit card required.</p>
            <button onClick={() => navigate('/signup')} className="btn-cta">
              Start Free Trial
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Features;
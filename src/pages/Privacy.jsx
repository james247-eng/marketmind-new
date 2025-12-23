// Privacy.jsx
// Privacy policy page - SEO optimized

import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Shield } from 'lucide-react';
import './Legal.css';

function Privacy() {
  return (
    <>
      <SEO 
        title="Privacy Policy - Market Mind | Your Data is Protected"
        description="Market Mind's privacy policy. Learn how we collect, use, and protect your personal information. GDPR and CCPA compliant."
        keywords="privacy policy, data protection, GDPR, CCPA, user privacy, data security"
      />

      <div className="legal-page">
        <Navbar />

        <section className="legal-hero">
          <div className="legal-container">
            <Shield size={64} className="legal-icon" />
            <h1>Privacy Policy</h1>
            <p>Last updated: December 20, 2024</p>
          </div>
        </section>

        <section className="legal-content">
          <div className="legal-container">
            <div className="legal-text">
              
              <h2>Introduction</h2>
              <p>
                At Market Mind, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our social media marketing platform.
              </p>

              <h2>Information We Collect</h2>
              <h3>Personal Information</h3>
              <p>When you register for Market Mind, we collect:</p>
              <ul>
                <li>Name and email address</li>
                <li>Business information (company name, industry)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Social media account access tokens (encrypted)</li>
              </ul>

              <h3>Usage Data</h3>
              <p>We automatically collect:</p>
              <ul>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address</li>
                <li>Pages visited and features used</li>
                <li>Time and date of access</li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and maintain our service</li>
                <li>Generate AI-powered content for your social media</li>
                <li>Schedule and publish posts to your connected accounts</li>
                <li>Provide customer support</li>
                <li>Send service updates and marketing communications</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement industry-standard security measures including:
              </p>
              <ul>
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Regular security audits and penetration testing</li>
                <li>Two-factor authentication (2FA)</li>
                <li>Secure token storage for social media credentials</li>
              </ul>

              <h2>Third-Party Services</h2>
              <p>We share data with trusted third-party providers:</p>
              <ul>
                <li><strong>Social Media Platforms:</strong> Facebook, Instagram, Twitter, TikTok, YouTube (for posting content)</li>
                <li><strong>Payment Processing:</strong> Stripe (for secure payment handling)</li>
                <li><strong>AI Services:</strong> Anthropic Claude, Perplexity (for content generation)</li>
                <li><strong>Analytics:</strong> Google Analytics (for usage tracking)</li>
                <li><strong>Cloud Storage:</strong> Cloudflare R2 (for media storage)</li>
              </ul>

              <h2>Your Rights (GDPR & CCPA)</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <h2>Data Retention</h2>
              <p>
                We retain your data as long as your account is active. After account deletion, we keep minimal data for 30 days for account recovery, then permanently delete all information except as required by law.
              </p>

              <h2>Cookies</h2>
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul>
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze site traffic</li>
                <li>Improve user experience</li>
              </ul>
              <p>You can control cookies through your browser settings.</p>

              <h2>Children's Privacy</h2>
              <p>
                Market Mind is not intended for users under 18 years old. We do not knowingly collect data from children. If you believe a child has provided us with personal information, please contact us immediately.
              </p>

              <h2>International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on our platform.
              </p>

              <h2>Contact Us</h2>
              <p>For privacy-related questions or to exercise your rights, contact us:</p>
              <ul>
                <li>Email: privacy@marketmind.com</li>
                <li>Address: Lagos, Nigeria</li>
              </ul>

              <div className="legal-footer-note">
                <p>
                  <strong>Powered by:</strong> <a href="https://easblink.com.ng" target="_blank" rel="noopener noreferrer">Easblink Tech</a>
                </p>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Privacy;
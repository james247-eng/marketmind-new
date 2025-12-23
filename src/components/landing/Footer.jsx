// Footer.jsx
// Landing page footer

import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="footer-container">
        
        {/* Footer Top */}
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">MM</div>
              <span>Market Mind</span>
            </div>
            <p className="footer-tagline">
              AI-Powered Social Media Marketing Made Simple
            </p>
            <div className="footer-socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <Twitter size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/features">Features</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/blog">Blog</Link>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <a href="https://easblink.com.ng" target="_blank" rel="noopener noreferrer">
                Easblink Tech
              </a>
              <a href="mailto:support@marketmind.com">Contact</a>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>

            <div className="footer-column">
              <h4>Newsletter</h4>
              <p className="newsletter-text">Subscribe for updates and tips</p>
              <div className="newsletter-form">
                <input type="email" placeholder="Enter your email" />
                <button>
                  <Mail size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>
            © {currentYear} Market Mind. All rights reserved. Powered by{' '}
            <a 
              href="https://easblink.com.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="easblink-link"
            >
              Easblink Tech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
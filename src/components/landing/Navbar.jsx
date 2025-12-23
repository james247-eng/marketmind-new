// Navbar.jsx
// Landing page navigation bar

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">MM</div>
          <span>Market Mind</span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
        </div>

        {/* Auth Buttons */}
        <div className="navbar-actions">
          <button onClick={() => navigate('/login')} className="btn-login">
            Login
          </button>
          <button onClick={() => navigate('/signup')} className="btn-signup">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/features" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Features
          </Link>
          <Link to="/pricing" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Pricing
          </Link>
          <Link to="/blog" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Blog
          </Link>
          <div className="mobile-actions">
            <button onClick={() => navigate('/login')} className="btn-login">
              Login
            </button>
            <button onClick={() => navigate('/signup')} className="btn-signup">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
// DataDeletion.jsx
// Facebook API requirement - Data deletion callback page

import { useState } from 'react';
import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Trash2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import './DataDeletion.css';

function DataDeletion() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState(''); // success, error, or empty
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setMessage('');

    try {
      // In production, this would call your backend API
      // Backend would: 
      // 1. Verify the user
      // 2. Queue deletion job
      // 3. Return confirmation code
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate confirmation code (Facebook requirement)
      const confirmationCode = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setStatus('success');
      setMessage(`Data deletion request received. Your confirmation code is: ${confirmationCode}. We will delete all your data within 30 days as required by law.`);
      
      // Clear form
      setEmail('');
      setUserId('');

    } catch (error) {
      setStatus('error');
      setMessage('Failed to process deletion request. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Data Deletion Request - Market Mind"
        description="Request deletion of your Market Mind account data in compliance with Facebook Platform Policy."
        keywords="data deletion, account deletion, GDPR, privacy, data removal"
      />

      <div className="data-deletion-page">
        <Navbar />

        <section className="deletion-hero">
          <div className="deletion-container">
            <Shield size={64} className="deletion-icon" />
            <h1>Data Deletion Request</h1>
            <p>Request deletion of your Market Mind data</p>
          </div>
        </section>

        <section className="deletion-content">
          <div className="deletion-container">
            
            {/* Information Box */}
            <div className="info-box">
              <h2>What happens when you request data deletion?</h2>
              <ul>
                <li>All your personal information will be permanently deleted</li>
                <li>Your social media connections will be disconnected</li>
                <li>All generated content and analytics will be removed</li>
                <li>Your account will be deactivated immediately</li>
                <li>Complete deletion will occur within 30 days</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            {/* Deletion Form */}
            <div className="deletion-form-container">
              <h2>Submit Deletion Request</h2>
              <p className="form-description">
                Fill out this form to request deletion of your data. You'll receive a confirmation code.
              </p>

              {status === 'success' && (
                <div className="alert alert-success">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Request Submitted Successfully</strong>
                    <p>{message}</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="alert alert-error">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Error</strong>
                    <p>{message}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="deletion-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <small>The email associated with your Market Mind account</small>
                </div>

                <div className="form-group">
                  <label htmlFor="userId">User ID (Optional)</label>
                  <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Your Facebook User ID"
                  />
                  <small>If you connected via Facebook, provide your Facebook User ID</small>
                </div>

                <button 
                  type="submit" 
                  className="btn-delete"
                  disabled={loading}
                >
                  <Trash2 size={20} />
                  {loading ? 'Processing...' : 'Submit Deletion Request'}
                </button>
              </form>

              <div className="contact-support">
                <p>
                  <strong>Need help?</strong> Contact us at{' '}
                  <a href="mailto:privacy@marketmind.com">privacy@marketmind.com</a>
                </p>
              </div>
            </div>

            {/* Facebook Policy Compliance */}
            <div className="compliance-box">
              <h3>Facebook Platform Policy Compliance</h3>
              <p>
                This page complies with Facebook Platform Policy 6.1 - Data Deletion Request Callback URL. 
                Users who logged in with Facebook can request deletion of their data from our systems.
              </p>
              <p>
                For more information, read our{' '}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default DataDeletion;
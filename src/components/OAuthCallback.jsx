// OAuthCallback.jsx
// Handles OAuth callbacks from social media platforms
// Redirects to dashboard after successful token exchange

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exchangeAuthorizationCode } from '../services/socialAuthService';
import './ErrorBoundary.css'; // Using existing error styling

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { platform } = useParams(); // youtube, meta, tiktok, instagram, twitter, linkedin, pinterest, snapchat
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // User denied access
        if (errorParam) {
          setError(`${platform} denied access: ${errorDescription || errorParam}`);
          setLoading(false);
          // Redirect to social accounts in 3 seconds
          setTimeout(() => navigate('/accounts?error=' + encodeURIComponent(errorDescription || errorParam)), 3000);
          return;
        }

        // No authorization code
        if (!code) {
          setError('No authorization code received from ' + platform);
          setLoading(false);
          setTimeout(() => navigate('/accounts?error=no_code'), 3000);
          return;
        }

        // User must be authenticated
        if (!currentUser) {
          setError('You must be logged in to connect social accounts');
          setLoading(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Exchange authorization code for access token
        const result = await exchangeAuthorizationCode(
          platform,
          code,
          state,
          currentUser.uid
        );

        if (result.success) {
          // Redirect to social accounts page with success message
          navigate('/accounts?success=' + encodeURIComponent(platform + ' connected successfully'));
        } else {
          setError(result.error || `Failed to connect ${platform}`);
          setTimeout(() => navigate('/accounts?error=' + encodeURIComponent(result.error || 'Connection failed')), 3000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/accounts'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [platform, searchParams, navigate, currentUser]);

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
        {loading && (
          <>
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2>Connecting {platform?.charAt(0).toUpperCase() + platform?.slice(1)}...</h2>
            <p>Please wait while we complete the connection.</p>
          </>
        )}

        {error && !loading && (
          <>
            <div style={{
              color: '#e74c3c',
              fontSize: '48px',
              marginBottom: '20px'
            }}>⚠️</div>
            <h2>Connection Failed</h2>
            <p style={{ color: '#e74c3c', marginBottom: '20px' }}>{error}</p>
            <p>Redirecting back to your accounts page...</p>
          </>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .auth-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .auth-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default OAuthCallback;

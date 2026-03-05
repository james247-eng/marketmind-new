// OAuthCallback.jsx
// Thin redirect shim — all real OAuth callback handling happens in SocialAccounts.jsx.
// When a platform redirects back with ?code=...&state=..., this component
// immediately forwards to /accounts where SocialAccounts.jsx reads the params
// and calls the correct handle*Callback() function.
//
// This file exists only because some platforms need a dedicated callback URL
// like /auth/youtube/callback. SocialAccounts.jsx handles the actual exchange.

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Forward all query params to /accounts so SocialAccounts.jsx can handle them
    const params = searchParams.toString();
    navigate(`/accounts${params ? `?${params}` : ''}`, { replace: true });
  }, []);

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background:   'white',
        borderRadius: '8px',
        padding:      '40px',
        textAlign:    'center',
        boxShadow:    '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          border:       '4px solid #f3f3f3',
          borderTop:    '4px solid #7c3aed',
          borderRadius: '50%',
          width:        '40px',
          height:       '40px',
          animation:    'spin 1s linear infinite',
          margin:       '0 auto 20px',
        }} />
        <h2>Completing connection...</h2>
        <p>Please wait a moment.</p>
        <style>{`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OAuthCallback;
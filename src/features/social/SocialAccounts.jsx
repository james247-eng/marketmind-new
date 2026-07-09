// SocialAccounts.jsx
// Connect and manage social media accounts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getConnectedAccounts,
  disconnectAccount,
  connectFacebook,
  connectTikTok,
  connectTwitter,
  connectYouTube,
  handleFacebookCallback,
  handleTikTokCallback,
  handleTwitterCallback,
  handleYouTubeCallback,
} from '../../services/socialMediaService';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { Link2, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './SocialAccounts.css';

// Maps the `state` param we set in each connect* function to its callback handler.
// This is the single source of truth for callback routing — no more string-sniffing
// on window.location.search.
const CALLBACK_HANDLERS = {
  facebook:  handleFacebookCallback,
  instagram: handleFacebookCallback, // Instagram auth flows through Facebook OAuth
  tiktok:    handleTikTokCallback,
  twitter:   handleTwitterCallback,
  youtube:   handleYouTubeCallback,
};

const PLATFORMS = [
  { id: 'facebook',  name: 'Facebook',   icon: '📘', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram',  icon: '📷', color: '#E4405F' },
  { id: 'twitter',   name: 'Twitter/X',  icon: '🐦', color: '#1DA1F2' },
  { id: 'tiktok',    name: 'TikTok',     icon: '🎵', color: '#000000' },
  { id: 'youtube',   name: 'YouTube',    icon: '▶️', color: '#FF0000' },
];

function SocialAccounts() {
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const { currentUser }                       = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading]                 = useState(true);
  // Tracks which platform card is mid-connect so we can show a spinner on it
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  
  // Guard reference to prevent race conditions during OAuth callback processing mounts
  const callbackProcessed = useRef(false);

  // ─── Fetch accounts ──────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const result = await getConnectedAccounts(currentUser.uid);
      if (result && result.success) {
        setConnectedAccounts(result.accounts || []);
      } else {
        setError('Failed to load accounts. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('An error occurred while loading connected channels.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ─── OAuth callback handling ─────────────────────────────────────────────────
  // Runs once on mount. Reads `code` and `state` from the URL query string.
  // `state` is set explicitly by each connect* function in socialMediaService.js
  // so we always know exactly which platform is returning.

  const handleOAuthCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state'); // e.g. "facebook", "twitter", "youtube"

    // No code = not a callback, nothing to do
    if (!code) return;

    // Auth hasn't loaded yet — the effect will re-run when currentUser is set
    if (!currentUser) return;

    // Prevent multi-triggering hooks in strict or rapid mounting lifecycles
    if (callbackProcessed.current) return;
    callbackProcessed.current = true;

    const handler = CALLBACK_HANDLERS[state];

    if (!handler) {
      setError(
        `Unrecognised OAuth callback (state="${state}"). ` +
        'Please try connecting the account again.'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    setConnectingPlatform(state);
    setLoading(true);

    try {
      const result = await handler(code, currentUser.uid);

      if (result && result.success) {
        setSuccess(`${formatPlatformName(state)} account connected successfully!`);
        await fetchAccounts();
      } else {
        setError(result?.error || `Failed to connect ${formatPlatformName(state)} account.`);
      }
    } catch (err) {
      console.error('OAuth callback execution error:', err);
      setError(`A system network exception blocked the ${formatPlatformName(state)} handshake.`);
    } finally {
      // Clean the URL so a page refresh doesn't re-attempt the exchange
      window.history.replaceState({}, document.title, window.location.pathname);
      setConnectingPlatform(null);
      setLoading(false);
    }
  }, [currentUser, fetchAccounts]);

  useEffect(() => {
    if (currentUser) {
      fetchAccounts();
      handleOAuthCallback();
    }
  }, [currentUser, fetchAccounts, handleOAuthCallback]);

  // Auto-clear alerts after 5 seconds
  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  // ─── Connect / disconnect ─────────────────────────────────────────────────────

  const handleConnect = (platformId) => {
    setError('');
    setSuccess('');

    switch (platformId) {
      case 'facebook':
      case 'instagram':
        connectFacebook();   // Both use the Facebook OAuth flow
        break;
      case 'tiktok':
        connectTikTok();
        break;
      case 'twitter':
        connectTwitter();
        break;
      case 'youtube':
        connectYouTube();
        break;
      default:
        setError(`${formatPlatformName(platformId)} is not supported yet.`);
    }
  };

  const handleDisconnect = async (accountId, platformName) => {
    if (!confirm(`Disconnect your ${platformName} account?`)) return;

    try {
      const result = await disconnectAccount(accountId);
      if (result && result.success) {
        setSuccess(`${platformName} account disconnected.`);
        await fetchAccounts();
      } else {
        setError(`Failed to disconnect ${platformName} account.`);
      }
    } catch (err) {
      console.error('Account disconnection error:', err);
      setError(`An unexpected error blocked removing your ${platformName} account.`);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const getAccountsForPlatform = (platformId) =>
    connectedAccounts.filter(acc => acc.platform === platformId);

  const isConnected = (platformId) =>
    connectedAccounts.some(acc => acc.platform === platformId);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">

          <div className="page-header">
            <div>
              <h1>Social Accounts</h1>
              <p>Connect your social media platforms to start posting</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {loading && connectedAccounts.length === 0 ? (
            <div className="loading-state">
              <Loader size={20} className="spin" />
              {connectingPlatform
                ? `Connecting ${formatPlatformName(connectingPlatform)}…`
                : 'Loading accounts…'}
            </div>
          ) : (
            <div className="platforms-grid">
              {PLATFORMS.map(platform => {
                const platformAccounts = getAccountsForPlatform(platform.id);
                const connected        = platformAccounts.length > 0;
                const isConnecting     = connectingPlatform === platform.id;

                return (
                  <div
                    key={platform.id}
                    className={`platform-card${connected ? ' platform-card--connected' : ''}`}
                  >
                    <div className="platform-header">
                      <div className="platform-info">
                        <span className="platform-icon">{platform.icon}</span>
                        <div>
                          <h3>{platform.name}</h3>
                          {!connected && (
                            <span className="account-status-disconnected">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Support mapping through multiple accounts/pages within the same platform type */}
                    {connected && (
                      <div className="connected-accounts-list">
                        {platformAccounts.map((account) => (
                          <div key={account.id || account.accountId} className="account-row-item">
                            <div className="account-meta-details">
                              <CheckCircle size={16} className="connected-icon" />
                              <span className="account-name">{account.accountName || 'Connected Channel'}</span>
                            </div>
                            <button
                              className="btn-row-disconnect"
                              onClick={() => handleDisconnect(account.id, platform.name)}
                              title={`Disconnect ${account.accountName}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="platform-footer">
                      {!connected && (
                        <button
                          className="btn-connect"
                          style={{ backgroundColor: platform.color }}
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting
                            ? <Loader size={16} className="spin" />
                            : <Link2 size={16} />}
                          {isConnecting ? 'Connecting…' : `Connect ${platform.name}`}
                        </button>
                      )}
                      {connected && (
                        <button
                          className="btn-connect-more"
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                        >
                          <Link2 size={14} />
                          Connect Another Page
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Capitalises the first letter for display in messages
function formatPlatformName(platformId) {
  return platformId
    ? platformId.charAt(0).toUpperCase() + platformId.slice(1)
    : 'Unknown';
}

export default SocialAccounts;
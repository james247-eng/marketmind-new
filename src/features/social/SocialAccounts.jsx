// SocialAccounts.jsx
// Connect and manage social media accounts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
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
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
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

  // ─── Fetch accounts ──────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const result = await getConnectedAccounts(currentUser.uid);
    if (result.success) {
      setConnectedAccounts(result.accounts);
    } else {
      setError('Failed to load accounts. Please refresh the page.');
    }
    setLoading(false);
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

    const handler = CALLBACK_HANDLERS[state];

    if (!handler) {
      // `state` param is missing or unrecognised — don't silently fall through
      setError(
        `Unrecognised OAuth callback (state="${state}"). ` +
        'Please try connecting the account again.'
      );
      // Still clean the URL so a refresh doesn't re-trigger this
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    setConnectingPlatform(state);
    setLoading(true);

    const result = await handler(code, currentUser.uid);

    if (result.success) {
      setSuccess(`${formatPlatformName(state)} account connected successfully!`);
      await fetchAccounts();
    } else {
      setError(result.error || `Failed to connect ${formatPlatformName(state)} account.`);
    }

    // Clean the URL so a page refresh doesn't re-attempt the exchange
    window.history.replaceState({}, document.title, window.location.pathname);
    setConnectingPlatform(null);
    setLoading(false);
  }, [currentUser, fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
    handleOAuthCallback();
  }, [fetchAccounts, handleOAuthCallback]);

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

    const result = await disconnectAccount(accountId);

    if (result.success) {
      setSuccess(`${platformName} account disconnected.`);
      await fetchAccounts();
    } else {
      setError(`Failed to disconnect ${platformName} account.`);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const isConnected = (platformId) =>
    connectedAccounts.some(acc => acc.platform === platformId);

  const getAccountName = (platformId) =>
    connectedAccounts.find(acc => acc.platform === platformId)?.accountName || '';

  const getAccountDocId = (platformId) =>
    connectedAccounts.find(acc => acc.platform === platformId)?.id || null;

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

          {loading ? (
            <div className="loading-state">
              <Loader size={20} className="spin" />
              {connectingPlatform
                ? `Connecting ${formatPlatformName(connectingPlatform)}…`
                : 'Loading accounts…'}
            </div>
          ) : (
            <div className="platforms-grid">
              {PLATFORMS.map(platform => {
                const connected    = isConnected(platform.id);
                const accountName  = getAccountName(platform.id);
                const accountDocId = getAccountDocId(platform.id);
                const isConnecting = connectingPlatform === platform.id;

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
                          {connected && (
                            <span className="account-name">{accountName}</span>
                          )}
                        </div>
                      </div>
                      {connected && (
                        <CheckCircle size={24} className="connected-icon" />
                      )}
                    </div>

                    <div className="platform-footer">
                      {connected ? (
                        <button
                          className="btn-disconnect"
                          onClick={() => handleDisconnect(accountDocId, platform.name)}
                        >
                          <X size={16} />
                          Disconnect
                        </button>
                      ) : (
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
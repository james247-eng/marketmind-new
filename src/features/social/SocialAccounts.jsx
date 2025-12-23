// SocialAccounts.jsx
// Connect and manage social media accounts

import { useState, useEffect } from 'react';
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
  handleYouTubeCallback
} from '../../services/socialMediaService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Link2, X, CheckCircle, AlertCircle } from 'lucide-react';
import './SocialAccounts.css';

function SocialAccounts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000' }
  ];

  useEffect(() => {
    fetchAccounts();
    handleOAuthCallback();
  }, [currentUser]);

  const fetchAccounts = async () => {
    if (!currentUser) return;

    setLoading(true);
    const result = await getConnectedAccounts(currentUser.uid);
    
    if (result.success) {
      setConnectedAccounts(result.accounts);
    } else {
      setError('Failed to load accounts');
    }
    setLoading(false);
  };

  const handleOAuthCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !currentUser) return;

    setLoading(true);

    let result;
    if (state === 'twitter') {
      result = await handleTwitterCallback(code, currentUser.uid);
    } else if (window.location.search.includes('tiktok')) {
      result = await handleTikTokCallback(code, currentUser.uid);
    } else if (window.location.search.includes('youtube')) {
      result = await handleYouTubeCallback(code, currentUser.uid);
    } else {
      result = await handleFacebookCallback(code, currentUser.uid);
    }

    if (result.success) {
      setSuccess('Account connected successfully!');
      fetchAccounts();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setError('Failed to connect account');
    }

    setLoading(false);
  };

  const handleConnect = (platform) => {
    switch (platform) {
      case 'facebook':
      case 'instagram':
        connectFacebook();
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
        setError('Platform not supported yet');
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    const result = await disconnectAccount(accountId);
    
    if (result.success) {
      setSuccess('Account disconnected');
      fetchAccounts();
    } else {
      setError('Failed to disconnect account');
    }
  };

  const isConnected = (platform) => {
    return connectedAccounts.some(acc => acc.platform === platform);
  };

  const getAccountName = (platform) => {
    const account = connectedAccounts.find(acc => acc.platform === platform);
    return account?.accountName || '';
  };

  const getAccountId = (platform) => {
    const account = connectedAccounts.find(acc => acc.platform === platform);
    return account?.id || null;
  };

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
            <div className="alert alert-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading-state">Loading accounts...</div>
          ) : (
            <div className="platforms-grid">
              {platforms.map(platform => {
                const connected = isConnected(platform.id);
                const accountName = getAccountName(platform.id);
                const accountId = getAccountId(platform.id);

                return (
                  <div key={platform.id} className="platform-card">
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
                          onClick={() => handleDisconnect(accountId)}
                        >
                          <X size={16} />
                          Disconnect
                        </button>
                      ) : (
                        <button 
                          className="btn-connect"
                          style={{ backgroundColor: platform.color }}
                          onClick={() => handleConnect(platform.id)}
                        >
                          <Link2 size={16} />
                          Connect {platform.name}
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

export default SocialAccounts;
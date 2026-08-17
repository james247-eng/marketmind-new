import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Link2, Loader, RefreshCw, Unplug } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { connectFacebook, connectLinkedIn, connectTikTok, connectTwitter, connectYouTube, disconnectSocialAccount, getSocialConnections, handleFacebookCallback, handleLinkedInCallback, handleTikTokCallback, handleTwitterCallback, handleYouTubeCallback } from '../../services/socialMediaService.js';
import './SocialAccounts.css';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: 'FB', color: '#1877F2' }, { id: 'instagram', name: 'Instagram', icon: 'IG', color: '#E4405F' },
  { id: 'twitter', name: 'Twitter/X', icon: 'X', color: '#1DA1F2' }, { id: 'tiktok', name: 'TikTok', icon: 'TT', color: '#111827' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'IN', color: '#0077B5' }, { id: 'youtube', name: 'YouTube', icon: 'YT', color: '#FF0000' },
];
const CALLBACKS = { facebook: handleFacebookCallback, instagram: handleFacebookCallback, twitter: handleTwitterCallback, tiktok: handleTikTokCallback, linkedin: handleLinkedInCallback, youtube: handleYouTubeCallback };
const asDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);

function SocialAccounts() {
  const { currentUser } = useAuth();
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = routeWorkspaceId || sessionStorage.getItem('marketmind.oauthWorkspaceId') || '';
  const [sidebarOpen, setSidebarOpen] = useState(false); const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true); const [connecting, setConnecting] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const processed = useRef(false);
  const load = useCallback(async () => {
    if (!workspaceId) return; setLoading(true); const result = await getSocialConnections(workspaceId);
    if (result.success) setAccounts(result.accounts.filter((account) => account.status !== 'disconnected')); else setError(result.error || 'Unable to load social connections.'); setLoading(false);
  }, [workspaceId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!currentUser || !workspaceId || processed.current) return;
    const params = new URLSearchParams(window.location.search); const code = params.get('code'); const rawState = params.get('state'); if (!code) return;
    const [platform, stateWorkspace] = String(rawState || '').split(':'); const targetWorkspace = stateWorkspace || sessionStorage.getItem('marketmind.oauthWorkspaceId'); const handler = CALLBACKS[platform];
    if (!handler || targetWorkspace !== workspaceId) { setError('OAuth callback did not match this workspace.'); return; }
    processed.current = true; setConnecting(platform); handler(code, currentUser.uid, workspaceId).then((result) => { if (result.success) { setSuccess(`${platform} connected successfully.`); load(); } else setError(result.error || 'Connection failed.'); }).catch((err) => setError(err.message)).finally(() => { window.history.replaceState({}, document.title, window.location.pathname); setConnecting(''); });
  }, [currentUser, load, workspaceId]);
  const connect = (platform) => { setError(''); setConnecting(platform); sessionStorage.setItem('marketmind.oauthWorkspaceId', workspaceId); try { ({ facebook: connectFacebook, instagram: (id) => connectFacebook(id, 'instagram'), twitter: connectTwitter, tiktok: connectTikTok, linkedin: connectLinkedIn, youtube: connectYouTube }[platform])(workspaceId); } catch (err) { setError(err.message); setConnecting(''); } };
  const disconnect = async (account) => { if (!confirm(`Disconnect ${account.accountName || account.platform}?`)) return; const result = await disconnectSocialAccount(workspaceId, account.id); if (result.success) { setSuccess('Account disconnected.'); load(); } else setError(result.error || 'Unable to disconnect account.'); };
  const isExpired = (account) => { const date = asDate(account.tokenExpiresAt); return date && !Number.isNaN(date.getTime()) && date <= new Date(); };
  const connectedPlatforms = new Set(accounts.map((account) => account.platform));
  return <div className="app"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content"><Header onMenuClick={() => setSidebarOpen(true)} /><div className="content-area">
    <div className="page-header"><div><h1>Social Connections</h1><p>Connect your channels to schedule and publish from Teamly AI.</p></div></div>
    {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}{success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}
    {!loading && accounts.length === 0 && <div className="empty-state"><Link2 size={42} /><p>Connect your social media accounts to start scheduling and publishing content directly from Teamly AI.</p></div>}
    {loading ? <div className="loading-state"><Loader size={22} className="spin" />Loading connections...</div> : <div className="platforms-grid">{PLATFORMS.map((platform) => { const connected = accounts.filter((account) => account.platform === platform.id); return <section className="platform-card" key={platform.id}><div className="platform-header"><div className="platform-info"><span className="platform-icon" style={{ backgroundColor: platform.color }}>{platform.icon}</span><div><h3>{platform.name}</h3><span>{connected.length ? `${connected.length} connected` : 'Not connected'}</span></div></div></div>{connected.map((account) => { const expired = isExpired(account); const date = asDate(account.connectedAt); return <div className="account-row-item" key={account.id}><div><strong>{account.accountName || 'Connected account'}</strong><small>{expired ? 'Expired' : 'Connected'}{date ? ` · ${date.toLocaleDateString()}` : ''}</small></div><div className="account-actions">{expired ? <button onClick={() => connect(platform.id)} disabled={!!connecting}><RefreshCw size={15} />Reconnect</button> : <button onClick={() => disconnect(account)}><Unplug size={15} />Disconnect</button>}</div></div>; })}<div className="platform-footer">{!connected.length && <button className="btn-connect" style={{ backgroundColor: platform.color }} onClick={() => connect(platform.id)} disabled={!!connecting}><Link2 size={16} />{connecting === platform.id ? 'Connecting...' : `Connect ${platform.name}`}</button>}</div></section>; })}</div>}
  </div></main></div>;
}
export default SocialAccounts;

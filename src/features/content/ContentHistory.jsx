// ContentHistory.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getConnectedAccounts, postToMultiplePlatforms } from '../../services/socialMediaService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FileText, Trash2, Copy, CheckCircle, AlertCircle, Loader, Send, RefreshCw } from 'lucide-react';
import './ContentHistory.css';

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: '💼', color: '#0077B5' },
  { key: 'instagram', label: 'Instagram', icon: '📷', color: '#E1306C' },
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', color: '#000000' },
  { key: 'youtube',   label: 'YouTube',   icon: '▶️', color: '#FF0000' },
  { key: 'facebook',  label: 'Facebook',  icon: '📘', color: '#1877F2' },
];

const parseContent = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  const strategies = [
    () => JSON.parse(raw),
    () => JSON.parse(raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()),
    () => { const m = raw.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error(); },
  ];
  for (const strategy of strategies) {
    try {
      const parsed = strategy();
      if (parsed && typeof parsed === 'object' && PLATFORMS.some(p => parsed[p.key])) return parsed;
    } catch { continue; }
  }
  return null;
};

function ContentHistory() {
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const { currentUser }                           = useAuth();
  const [contentList,       setContentList]       = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState('');
  const [copiedId,          setCopiedId]          = useState(null);
  const [activeTabs,        setActiveTabs]        = useState({});
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [repostOpen,        setRepostOpen]        = useState({});
  const [repostSelected,    setRepostSelected]    = useState({});
  const [repostLoading,     setRepostLoading]     = useState({});
  const [repostResults,     setRepostResults]     = useState({});

  const fetchContent = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true); setError('');
    try {
      const q = query(
        collection(db, 'content'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snap  = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContentList(items);
      const tabs = {};
      items.forEach(item => { tabs[item.id] = 'twitter'; });
      setActiveTabs(tabs);
    } catch (err) {
      console.error(err);
      setError('Failed to load content history.');
    } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    if (!currentUser) return;
    getConnectedAccounts(currentUser.uid).then(r => {
      if (r.success) setConnectedAccounts(r.accounts || []);
    });
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'content', id));
      setContentList(prev => prev.filter(item => item.id !== id));
    } catch { setError('Failed to delete.'); }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { setError('Failed to copy.'); }
  };

  const toggleRepostPanel = (id) => {
    const opening = !repostOpen[id];
    setRepostOpen(prev => ({ ...prev, [id]: opening }));
    setRepostResults(prev => ({ ...prev, [id]: [] }));
    // Do NOT pre-select all — user must deliberately choose which accounts to post to
    if (opening) {
      setRepostSelected(prev => ({ ...prev, [id]: [] }));
    }
  };

  const toggleAccount = (cardId, accountId) => {
    setRepostSelected(prev => {
      const current = prev[cardId] || [];
      return {
        ...prev,
        [cardId]: current.includes(accountId)
          ? current.filter(id => id !== accountId)
          : [...current, accountId],
      };
    });
  };

  const handleRepost = async (item) => {
    const cardId   = item.id;
    const selected = repostSelected[cardId] || [];
    if (selected.length === 0) { setError('Select at least one account to repost to.'); return; }
    setRepostLoading(prev => ({ ...prev, [cardId]: true }));
    setRepostResults(prev => ({ ...prev, [cardId]: [] }));
    setError('');
    try {
      const accounts = connectedAccounts.filter(a => selected.includes(a.id));
      const parsed   = parseContent(item.content);
      const result   = await postToMultiplePlatforms(
        parsed || { facebook: item.content, twitter: item.content },
        accounts,
        item.imageUrl || null
      );
      setRepostResults(prev => ({ ...prev, [cardId]: result.results || [] }));
    } catch (err) {
      setError('Repost failed: ' + err.message);
    } finally {
      setRepostLoading(prev => ({ ...prev, [cardId]: false }));
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">

          <div className="page-header">
            <div>
              <h1>Content History</h1>
              <p>View, repost, and manage your previously generated content</p>
            </div>
            <button className="btn-refresh" onClick={fetchContent}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {error && <div className="alert alert-error"><AlertCircle size={18} /> {error}</div>}

          {loading ? (
            <div className="loading-state">
              <Loader size={28} className="spin" />
              <p>Loading your content...</p>
            </div>
          ) : contentList.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} className="empty-icon" />
              <h2>No content yet</h2>
              <p>Generate your first piece of content to see it here</p>
              <a href="/generate" className="btn-primary-link">Generate Content →</a>
            </div>
          ) : (
            <div className="history-grid">
              {contentList.map(item => {
                const parsed             = parseContent(item.content);
                const activeTab          = activeTabs[item.id] || 'twitter';
                const activeText         = parsed ? (parsed[activeTab] || '') : (item.content || '');
                const availablePlatforms = parsed
                  ? PLATFORMS.filter(p => parsed[p.key] && parsed[p.key].trim())
                  : [];
                const isRepostOpen      = repostOpen[item.id];
                const isRepostLoading   = repostLoading[item.id];
                const thisRepostResults = repostResults[item.id] || [];
                const selectedAccounts  = repostSelected[item.id] || [];

                return (
                  <div key={item.id} className="history-card">

                    {/* Header */}
                    <div className="history-card-header">
                      <div className="history-card-meta">
                        {item.tone && <span className={`tone-badge tone-${item.tone}`}>{item.tone}</span>}
                        {item.status && <span className={`status-badge status-${item.status}`}>{item.status}</span>}
                        <span className="history-date">{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="history-card-actions">
                        <button className="btn-icon" onClick={() => handleCopy(item.id, activeText)} title="Copy">
                          {copiedId === item.id
                            ? <CheckCircle size={16} className="icon-success" />
                            : <Copy size={16} />}
                        </button>
                        <button
                          className={`btn-icon btn-repost-toggle ${isRepostOpen ? 'active' : ''}`}
                          onClick={() => toggleRepostPanel(item.id)}
                          title="Repost">
                          <Send size={16} />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(item.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Prompt */}
                    {item.prompt && (
                      <div className="history-prompt">
                        <span className="prompt-label">Prompt</span>
                        <p>{item.prompt}</p>
                      </div>
                    )}

                    {/* Image */}
                    {item.imageUrl && (
                      <div className="history-image-wrap">
                        <img src={item.imageUrl} alt="Attached media" className="history-image" />
                      </div>
                    )}

                    {/* Platform tabs + content */}
                    {parsed && availablePlatforms.length > 0 ? (
                      <div className="history-platforms">
                        <div className="history-tabs">
                          {availablePlatforms.map(p => (
                            <button
                              key={p.key}
                              className={`history-tab ${activeTab === p.key ? 'active' : ''}`}
                              style={activeTab === p.key ? { borderBottomColor: p.color, color: p.color } : {}}
                              onClick={() => setActiveTabs(prev => ({ ...prev, [item.id]: p.key }))}>
                              {p.icon} {p.label}
                            </button>
                          ))}
                        </div>
                        <div className="history-content-body">
                          <p className="history-content-text">{parsed[activeTab] || ''}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="history-content-body">
                        <p className="history-content-text">{item.content || ''}</p>
                      </div>
                    )}

                    {/* Research accordion */}
                    {item.researchInsights && (
                      <details className="research-accordion">
                        <summary>📊 View market research insights</summary>
                        <div className="research-body"><p>{item.researchInsights}</p></div>
                      </details>
                    )}

                    {/* Repost panel */}
                    {isRepostOpen && (
                      <div className="repost-panel">
                        <p className="repost-panel-title">📤 Repost to:</p>
                        {connectedAccounts.length === 0 ? (
                          <p className="repost-hint">No connected accounts. <a href="/accounts">Connect platforms →</a></p>
                        ) : (
                          <div className="repost-accounts">
                            {connectedAccounts.map(account => (
                              <label key={account.id} className="repost-account-label">
                                <input
                                  type="checkbox"
                                  checked={selectedAccounts.includes(account.id)}
                                  onChange={() => toggleAccount(item.id, account.id)}
                                />
                                <span>{account.platform.toUpperCase()} — {account.accountName}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <button
                          className="btn-repost-now"
                          onClick={() => handleRepost(item)}
                          disabled={isRepostLoading || selectedAccounts.length === 0}>
                          {isRepostLoading
                            ? <><Loader size={14} className="spin" /> Posting...</>
                            : <><Send size={14} /> Post Now</>}
                        </button>
                        {thisRepostResults.length > 0 && (
                          <div className="repost-results">
                            {thisRepostResults.map((r, i) => (
                              <div key={i} className={`repost-result ${r.success ? 'success' : 'error'}`}>
                                {r.success ? '✅' : '❌'} {r.platform} — {r.accountName}
                                {!r.success && r.error && <span className="repost-error-msg"> : {r.error}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

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

export default ContentHistory;
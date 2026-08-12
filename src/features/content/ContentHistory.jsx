// ContentHistory.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getConnectedAccounts, postToMultiplePlatforms } from '../../services/socialMediaService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FileText, Trash2, Copy, CheckCircle, AlertCircle, Loader, Send, RefreshCw } from 'lucide-react';
import './ContentHistory.css';
import COLLECTIONS from '../../lib/schema.js';

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
    () => JSON.parse(raw.trim()),
    () => JSON.parse(raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()),
    () => {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error();
    }
  ];

  for (const strategy of strategies) {
    try {
      const clean = strategy();
      if (clean && typeof clean === 'object') return clean;
    } catch {
      continue;
    }
  }
  return null;
};

function ContentHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [repostLoadingId, setRepostLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // UI Multi-State Action Trackers Keyed by Document ID to prevent index lookups crossing contexts
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [copiedPlatformKey, setCopiedPlatformKey] = useState(null);
  const [selectedAccountsMap, setSelectedAccountsMap] = useState({});
  const [repostResultsMap, setRepostResultsMap] = useState({});

  // ─── Data Hydration Layer ──────────────────────────────────────────────────

  const fetchInitialContext = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');

    try {
      // 1. Fetch connected workspaces
      const bizQuery = query(collection(db, COLLECTIONS.workspaces), where('userId', '==', currentUser.uid));
      const bizSnapshot = await getDocs(bizQuery);
      const bizList = bizSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBusinesses(bizList);

      if (bizList.length > 0) {
        setSelectedBusinessId(bizList[0].id);
      }

      // 2. Fetch linked social platform distribution channels
      const accResult = await getConnectedAccounts(currentUser.uid, bizList[0]?.id);
      if (accResult && accResult.success) {
        setConnectedAccounts(accResult.accounts || []);
      }
    } catch (err) {
      console.error('Context allocation failure:', err);
      setError('System could not pre-populate active user workspace states.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchHistory = useCallback(async () => {
    if (!currentUser || !selectedBusinessId) return;
    setLoading(true);
    setError('');
    
    try {
      const historyQuery = query(
        collection(db, COLLECTIONS.contentItems(selectedBusinessId)),
        where('userId', '==', currentUser.uid),
        where('businessId', '==', selectedBusinessId),
        orderBy('createdAt', 'desc')
      );
      
      let snapshot;
      try {
        snapshot = await getDocs(historyQuery);
      } catch (indexErr) {
        console.warn('Fallback execution triggered. Primary Firestore custom index missing:', indexErr.message);
        const fallbackQuery = query(
          collection(db, COLLECTIONS.contentItems(selectedBusinessId)),
          where('userId', '==', currentUser.uid),
          where('businessId', '==', selectedBusinessId)
        );
        snapshot = await getDocs(fallbackQuery);
      }

      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Client-side execution sorting backup block
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setHistoryItems(items);
    } catch (err) {
      console.error('History lookup thread crashed:', err);
      setError('Failed to fetch past content options from your workspace.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedBusinessId]);

  useEffect(() => {
    fetchInitialContext();
  }, [fetchInitialContext]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchHistory();
    }
  }, [selectedBusinessId, fetchHistory]);

  // Alert dismiss auto-lifecycle hook
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => { setError(''); setSuccess(''); }, 6000);
    return () => clearTimeout(t);
  }, [error, success]);

  // ─── Operations Logic ──────────────────────────────────────────────────────

  const handleCopyText = async (text, platformKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatformKey(platformKey);
      setTimeout(() => setCopiedPlatformKey(null), 2000);
    } catch {
      setError('Unable to copy requested text blocks to your local clipboard.');
    }
  };

  const handleDeleteItem = async (itemId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this content log from your historical archives?')) return;
    
    try {
      await deleteDoc(doc(db, COLLECTIONS.contentItems(selectedBusinessId), itemId));
      setSuccess('Log item permanently cleared from dashboard profile history.');
      setHistoryItems(prev => prev.filter(item => item.id !== itemId));
      if (expandedItemId === itemId) setExpandedItemId(null);
    } catch (err) {
      console.error('Deletion failure:', err);
      setError('System network block prevented full document asset purging.');
    }
  };

  const toggleAccountSelection = (itemId, accountId) => {
    setSelectedAccountsMap(prev => {
      const currentSelection = prev[itemId] || [];
      const updated = currentSelection.includes(accountId)
        ? currentSelection.filter(id => id !== accountId)
        : [...currentSelection, accountId];
      return { ...prev, [itemId]: updated };
    });
  };

  const handleRepostExecution = async (item) => {
    const itemSelectedAccounts = selectedAccountsMap[item.id] || [];
    if (itemSelectedAccounts.length === 0) {
      alert('Please toggle on at least one linked account channel check box before executing a repost payload dispatch.');
      return;
    }

    setRepostLoadingId(item.id);
    setError('');
    
    try {
      const targetAccounts = connectedAccounts.filter(acc => itemSelectedAccounts.includes(acc.id));
      const normalizedPayload = parseContent(item.content) || item.content;

      const postingOutcomes = await postToMultiplePlatforms(
        targetAccounts,
        normalizedPayload,
        item.imageUrl || null
      );

      setRepostResultsMap(prev => ({ ...prev, [item.id]: postingOutcomes }));
      
      const distinctFailures = postingOutcomes.some(res => !res.success);
      if (distinctFailures) {
        setSuccess('⚠️ Repost complete but partial processing block errors were caught across distribution channels.');
      } else {
        setSuccess('🎉 Repost distribution processes fully executed across chosen platforms!');
      }
    } catch (err) {
      console.error('Repost processing engine crash context:', err);
      setError(`Critical posting termination exception raised: ${err.message}`);
    } finally {
      setRepostLoadingId(null);
    }
  };

  const toggleExpandRow = (itemId) => {
    setExpandedItemId(prev => (prev === itemId ? null : itemId));
    // Seed selected account items automatically with matching account channels on expand
    if (!selectedAccountsMap[itemId]) {
      const targetItem = historyItems.find(i => i.id === itemId);
      const parsed = parseContent(targetItem?.content);
      if (parsed) {
        const structuralPlatforms = Object.keys(parsed);
        const automaticallyMatchedIds = connectedAccounts
          .filter(acc => structuralPlatforms.includes(acc.platform))
          .map(acc => acc.id);
        setSelectedAccountsMap(prev => ({ ...prev, [itemId]: automaticallyMatchedIds }));
      }
    }
  };

  // ─── Layout Output ─────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          
          <div className="page-header">
            <div>
              <h1>Content History</h1>
              <p>Review, repurpose, and verify logs of generated content templates across linked profiles</p>
            </div>
            
            {businesses.length > 0 && (
              <div className="business-selector-wrap">
                <select 
                  className="business-history-select"
                  value={selectedBusinessId} 
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="status">
              <CheckCircle size={18} /> {success}
            </div>
          )}

          {loading && historyItems.length === 0 ? (
            <div className="loading-state">
              <Loader size={24} className="spin" />
              <span>Querying saved records metrics...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="empty-state-container">
              <FileText size={48} className="empty-icon" />
              <h3>No History Found</h3>
              <p>You haven't saved any generation outputs for this business workspace yet.</p>
            </div>
          ) : (
            <div className="history-list-wrapper">
              {historyItems.map((item) => {
                const parsedPayload = parseContent(item.content);
                const isExpanded = expandedItemId === item.id;
                const activeSelections = selectedAccountsMap[item.id] || [];
                const itemPostOutcomes = repostResultsMap[item.id] || [];
                const isCurrentlyPosting = repostLoadingId === item.id;

                return (
                  <div 
                    key={item.id} 
                    className={`history-card-item ${isExpanded ? 'history-card-item--expanded' : ''}`}
                    onClick={() => toggleExpandRow(item.id)}
                  >
                    
                    {/* Compact Card Header Interface Row */}
                    <div className="history-card-summary">
                      <div className="history-meta-block">
                        <span className="history-timestamp-badge">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Date Unspecified'}
                        </span>
                        <h4 className="history-prompt-summary-text">{item.prompt || 'Manual Draft Content'}</h4>
                        <span className={`status-badge-indicator status-badge-indicator--${item.status || 'draft'}`}>
                          {item.status || 'draft'}
                        </span>
                      </div>
                      
                      <div className="history-row-actions" onClick={e => e.stopPropagation()}>
                        <button 
                          className="action-btn-trigger action-btn-trigger--delete"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          title="Purge record"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="action-btn-trigger action-btn-trigger--expand">
                          <RefreshCw size={16} className={isCurrentlyPosting ? 'spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Extended Interactive Detailed Display Block Drawer */}
                    {isExpanded && (
                      <div className="history-card-drawer-details" onClick={e => e.stopPropagation()}>
                        
                        {item.researchInsights && (
                          <div className="drawer-insight-highlight-pane">
                            <h5>Attached Market Research Insights Context:</h5>
                            <p>{item.researchInsights}</p>
                          </div>
                        )}

                        <div className="drawer-content-split-grid">
                          
                          {/* Text/Platform Management Panels */}
                          <div className="drawer-text-blocks-section">
                            {parsedPayload ? (
                              <div className="parsed-platforms-outputs-stack">
                                {PLATFORMS.map(p => {
                                  const textValue = parsedPayload[p.key];
                                  if (!textValue) return null;
                                  
                                  return (
                                    <div key={p.key} className="platform-historical-output-block">
                                      <div className="platform-block-meta-header">
                                        <span>{p.icon} <strong>{p.label} Copy</strong></span>
                                        <button 
                                          className="btn-mini-copy" 
                                          onClick={() => handleCopyText(textValue, `${item.id}-${p.key}`)}
                                        >
                                          {copiedPlatformKey === `${item.id}-${p.key}` ? <CheckCircle size={12} /> : <Copy size={12} />}
                                          {copiedPlatformKey === `${item.id}-${p.key}` ? 'Copied' : 'Copy Block'}
                                        </button>
                                      </div>
                                      <p className="platform-raw-copytext-render">{textValue}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="unparsed-historical-output-block">
                                <div className="platform-block-meta-header">
                                  <span>📝 <strong>Raw Block Text Output</strong></span>
                                  <button 
                                    className="btn-mini-copy" 
                                    onClick={() => handleCopyText(item.content, item.id)}
                                  >
                                    {copiedPlatformKey === item.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                                    {copiedPlatformKey === item.id ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <p className="platform-raw-copytext-render">{item.content}</p>
                              </div>
                            )}
                          </div>

                          {/* Graphical Assets + Quick Repost Execution Panel Controls */}
                          <div className="drawer-assets-controls-section">
                            {item.imageUrl && (
                              <div className="drawer-graphic-media-container">
                                <h5>Attached Marketing Graphic Asset:</h5>
                                <div className="media-preview-box-wrapper">
                                  {item.imageUrl.toLowerCase().includes('.mp4') ? (
                                    <video src={item.imageUrl} controls className="media-file-asset-render" />
                                  ) : (
                                    <img src={item.imageUrl} alt="Historical compilation graphic" className="media-file-asset-render" />
                                  )}
                                </div>
                              </div>
                            )}

                            {connectedAccounts.length > 0 ? (
                              <div className="drawer-repost-action-panel">
                                <h5>Republish/Repost Operations Node</h5>
                                <p className="panel-instructions-label">Select profiles to deploy copies to immediately:</p>
                                
                                <div className="panel-channels-checkboxes-list">
                                  {connectedAccounts.map(account => (
                                    <label key={account.id} className="checkbox-channel-row-item">
                                      <input 
                                        type="checkbox" 
                                        checked={activeSelections.includes(account.id)}
                                        onChange={() => toggleAccountSelection(item.id, account.id)}
                                      />
                                      <span className="checkbox-custom-platform-icon">
                                        {PLATFORMS.find(p => p.key === account.platform)?.icon || '🔗'}
                                      </span>
                                      <span className="checkbox-channel-display-identity">
                                        {account.platform.toUpperCase()} — {account.accountName}
                                      </span>
                                    </label>
                                  ))}
                                </div>

                                <button 
                                  className="btn-execute-repost-now"
                                  onClick={() => handleRepostExecution(item)}
                                  disabled={isCurrentlyPosting || activeSelections.length === 0}
                                >
                                  {isCurrentlyPosting ? (
                                    <><Loader size={14} className="spin" /> <span>Deploying posts...</span></>
                                  ) : (
                                    <><Send size={14} /> <span>Repost Selected Channels</span></>
                                  )}
                                </button>

                                {itemPostOutcomes.length > 0 && (
                                  <div className="panel-execution-outcomes-report-card">
                                    {itemPostOutcomes.map((res, index) => (
                                      <div key={index} className={`outcomes-report-row outcomes-report-row--${res.success ? 'success' : 'error'}`}>
                                        <span>{res.success ? '✅' : '❌'} <strong>{res.platform.toUpperCase()}</strong> ({res.accountName})</span>
                                        {!res.success && res.error && <p className="outcome-row-error-print">Error: {res.error}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="drawer-repost-missing-channels-hint">
                                <AlertCircle size={16} />
                                <p>No linked channels found. Link your accounts in the <a href="/app/:workspaceId/social">Social Accounts Panel</a> to toggle live background repost hooks.</p>
                              </div>
                            )}
                          </div>

                        </div>
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

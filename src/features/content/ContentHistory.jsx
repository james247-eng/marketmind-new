// ContentHistory.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FileText, Trash2, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './ContentHistory.css';

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter/X',  icon: '🐦' },
  { key: 'linkedin',  label: 'LinkedIn',   icon: '💼' },
  { key: 'instagram', label: 'Instagram',  icon: '📷' },
  { key: 'tiktok',    label: 'TikTok',     icon: '🎵' },
  { key: 'youtube',   label: 'YouTube',    icon: '▶️' },
  { key: 'facebook',  label: 'Facebook',   icon: '📘' },
];

const parseContent = (raw) => {
  if (!raw) return null;
  const attempts = [
    () => raw.trim(),
    () => raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim(),
    () => { const m = raw.match(/\{[\s\S]*\}/); return m ? m[0] : null; },
  ];
  for (const attempt of attempts) {
    try {
      const cleaned = attempt();
      if (!cleaned) continue;
      const parsed = JSON.parse(cleaned);
      if (PLATFORMS.some(p => parsed[p.key])) return parsed;
    } catch { continue; }
  }
  return null;
};

function ContentHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser }               = useAuth();
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [copiedId, setCopiedId]       = useState(null);
  const [activeTabs, setActiveTabs]   = useState({});

  const fetchContent = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true); setError('');
    try {
      const q = query(
        collection(db, 'content'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContentList(items);
      const tabs = {};
      items.forEach(item => { tabs[item.id] = 'twitter'; });
      setActiveTabs(tabs);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content history.');
    } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return;
    try {
      await deleteDoc(doc(db, 'content', id));
      setContentList(prev => prev.filter(item => item.id !== id));
    } catch { setError('Failed to delete.'); }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
    } catch { setError('Failed to copy.'); }
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
            <div><h1>Content History</h1><p>View and manage your previously generated content</p></div>
          </div>

          {error && <div className="alert alert-error"><AlertCircle size={18} /> {error}</div>}

          {loading ? (
            <div className="loading-state"><Loader size={20} className="spin" /> Loading content...</div>
          ) : contentList.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} className="empty-icon" />
              <h2>No content yet</h2>
              <p>Generate your first piece of content to see it here</p>
            </div>
          ) : (
            <div className="content-list">
              {contentList.map(item => {
                const parsed    = parseContent(item.content);
                const activeTab = activeTabs[item.id] || 'twitter';
                const activeText = parsed ? (parsed[activeTab] || '') : item.content;
                const availablePlatforms = parsed ? PLATFORMS.filter(p => parsed[p.key]) : [];

                return (
                  <div key={item.id} className="content-card">
                    <div className="content-card-header">
                      <div className="content-meta">
                        <span className={`tone-badge tone-${item.tone}`}>{item.tone || 'general'}</span>
                        <span className="content-date">{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="content-actions">
                        <button className="btn-icon" onClick={() => handleCopy(item.id, activeText)} title="Copy">
                          {copiedId === item.id ? <CheckCircle size={18} className="icon-success" /> : <Copy size={18} />}
                        </button>
                        <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(item.id)} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {item.prompt && <p className="content-prompt"><strong>Prompt:</strong> {item.prompt}</p>}

                    {parsed ? (
                      <>
                        <div className="platform-tabs">
                          {availablePlatforms.map(p => (
                            <button key={p.key}
                              className={`platform-tab ${activeTab === p.key ? 'active' : ''}`}
                              onClick={() => setActiveTabs(prev => ({ ...prev, [item.id]: p.key }))}>
                              {p.icon} {p.label}
                            </button>
                          ))}
                        </div>
                        <div className="content-body">
                          <p className="content-text">{parsed[activeTab] || ''}</p>
                        </div>
                      </>
                    ) : (
                      <div className="content-body">
                        <p className="content-text">{item.content}</p>
                      </div>
                    )}

                    {item.imageUrl && <div className="content-image"><img src={item.imageUrl} alt="Attached" /></div>}

                    {item.researchInsights && (
                      <details className="research-accordion">
                        <summary>View market research insights</summary>
                        <p>{item.researchInsights}</p>
                      </details>
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
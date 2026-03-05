// ContentHistory.jsx
// View and manage previously generated content

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FileText, Trash2, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './ContentHistory.css';

function ContentHistory() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const { currentUser }                 = useAuth();
  const [contentList, setContentList]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [copiedId, setCopiedId]         = useState(null); // tracks which card just got copied

  // ─── Fetch all content for this user ───────────────────────────────────────

  const fetchContent = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');

    try {
      const q = query(
        collection(db, 'content'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setContentList(items);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content history. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // ─── Delete a content item ──────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'content', id));
      setContentList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete content.');
    }
  };

  // ─── Copy content to clipboard ──────────────────────────────────────────────

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Failed to copy to clipboard.');
    }
  };

  // ─── Format date ────────────────────────────────────────────────────────────

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
      hour:  '2-digit',
      minute:'2-digit',
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">

          <div className="page-header">
            <div>
              <h1>Content History</h1>
              <p>View and manage your previously generated content</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <Loader size={20} className="spin" />
              Loading content...
            </div>
          ) : contentList.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} className="empty-icon" />
              <h2>No content yet</h2>
              <p>Generate your first piece of content to see it here</p>
            </div>
          ) : (
            <div className="content-list">
              {contentList.map(item => (
                <div key={item.id} className="content-card">

                  {/* Card header */}
                  <div className="content-card-header">
                    <div className="content-meta">
                      <span className={`tone-badge tone-${item.tone}`}>
                        {item.tone || 'general'}
                      </span>
                      <span className="content-date">{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="content-actions">
                      <button
                        className="btn-icon"
                        title="Copy content"
                        onClick={() => handleCopy(item.id, item.content)}
                      >
                        {copiedId === item.id
                          ? <CheckCircle size={18} className="icon-success" />
                          : <Copy size={18} />}
                      </button>
                      <button
                        className="btn-icon btn-icon--danger"
                        title="Delete content"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Prompt used */}
                  {item.prompt && (
                    <p className="content-prompt">
                      <strong>Prompt:</strong> {item.prompt}
                    </p>
                  )}

                  {/* Generated content body */}
                  <div className="content-body">
                    <pre className="content-text">{item.content}</pre>
                  </div>

                  {/* Attached image if any */}
                  {item.imageUrl && (
                    <div className="content-image">
                      <img src={item.imageUrl} alt="Attached media" />
                    </div>
                  )}

                  {/* Research insights if any */}
                  {item.researchInsights && (
                    <details className="research-accordion">
                      <summary>View market research insights</summary>
                      <p className="research-text">{item.researchInsights}</p>
                    </details>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default ContentHistory;
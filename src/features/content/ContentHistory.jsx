import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CalendarPlus, Check, Copy, FileText, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { deleteContentItem, getContentItems } from '../../services/contentService.js';
import './ContentHistory.css';

const PAGE_SIZE = 20;
const CONTENT_TYPES = [
  ['all', 'All content types'], ['social-post', 'Social Media Post'], ['product-description', 'Product Description'],
  ['email-newsletter', 'Email Newsletter'], ['ad-copy', 'Ad Copy'], ['blog-post-intro', 'Blog Post Intro'],
];
const PLATFORMS = [
  ['all', 'All platforms', ''], ['instagram', 'Instagram', 'IG'], ['facebook', 'Facebook', 'FB'],
  ['twitter', 'Twitter/X', 'X'], ['linkedin', 'LinkedIn', 'IN'], ['tiktok', 'TikTok', 'TT'],
];
const STATUSES = [['all', 'All statuses'], ['draft', 'Draft'], ['scheduled', 'Scheduled'], ['published', 'Published'], ['failed', 'Failed']];
const initialFilters = { search: '', contentType: 'all', platform: 'all', status: 'all', from: '', to: '' };

const getDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);
const getText = (item) => String(item.selectedVariant || item.content || item.prompt || '');
const getLabel = (options, value) => options.find(([key]) => key === value)?.[1] || value || 'Unknown';

function ContentHistory() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const loadItems = useCallback(async (append = false) => {
    if (!workspaceId) { setError('No workspace was selected.'); setLoading(false); return; }
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    const offset = append ? items.length : 0;
    const result = await getContentItems(workspaceId, { ...filters, offset, limit: PAGE_SIZE });
    if (result.success) {
      setItems((current) => append ? [...current, ...result.content] : result.content);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } else setError(result.error || 'Unable to load content history.');
    setLoading(false); setLoadingMore(false);
  }, [filters, items.length, workspaceId]);

  useEffect(() => {
    const timer = setTimeout(() => loadItems(false), 200);
    return () => clearTimeout(timer);
  }, [filters, workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const copyContent = async (item) => {
    try { await navigator.clipboard.writeText(getText(item)); setCopiedId(item.id); setTimeout(() => setCopiedId(''), 1800); }
    catch { setError('Content could not be copied to the clipboard.'); }
  };
  const removeItem = async (item) => {
    if (!confirm('Delete this content item? This action cannot be undone.')) return;
    const result = await deleteContentItem(workspaceId, item.id);
    if (!result.success) { setError(result.error || 'Unable to delete content.'); return; }
    setItems((current) => current.filter(({ id }) => id !== item.id)); setTotal((current) => Math.max(0, current - 1));
  };
  const openGenerator = (item) => navigate(`/app/${workspaceId}/content`, { state: { editContentItem: item } });
  const openScheduler = (item) => navigate(`/app/${workspaceId}/calendar`, { state: { preloadContentItemId: item.id } });

  return <div className="app">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <main className="main-content"><Header onMenuClick={() => setSidebarOpen(true)} /><div className="content-area">
      <div className="page-header"><div><h1>Content History</h1><p>Find, reuse, and manage content created for this workspace.</p></div><strong className="history-total">{total} item{total === 1 ? '' : 's'}</strong></div>
      <section className="history-filters" aria-label="Content filters">
        <label className="history-search"><Search size={17} /><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search content" /></label>
        <select value={filters.contentType} onChange={(event) => updateFilter('contentType', event.target.value)} aria-label="Content type">{CONTENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filters.platform} onChange={(event) => updateFilter('platform', event.target.value)} aria-label="Platform">{PLATFORMS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} aria-label="Status">{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <label className="date-filter"><span>From</span><input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></label>
        <label className="date-filter"><span>To</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => updateFilter('to', event.target.value)} /></label>
      </section>
      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {loading ? <div className="history-skeleton" aria-label="Loading content">{[1, 2, 3].map((key) => <div key={key} className="skeleton-card"><span /><span /><span /></div>)}</div> : items.length === 0 ? <div className="empty-state">
        <FileText size={44} className="empty-icon" /><h2>{total === 0 && Object.values(filters).every((value) => !value || value === 'all') ? 'No content yet' : 'No matching content'}</h2>
        {Object.values(filters).every((value) => !value || value === 'all') ? <p>You have not generated any content yet. Go to Generate Content to create your first piece.</p> : <p>No content matches your filters. Try adjusting your search.</p>}
        <Link className="btn-primary-link" to={`/app/${workspaceId}/content`}>Generate Content</Link>
      </div> : <>
        <div className="history-grid">{items.map((item) => {
          const text = getText(item); const platform = PLATFORMS.find(([key]) => key === item.platform); const created = getDate(item.createdAt);
          return <article className="history-card" key={item.id}>
            <div className="history-card-header"><div className="history-card-meta"><span className="type-badge">{getLabel(CONTENT_TYPES, item.contentType)}</span>{item.platform && <span className="platform-badge"><b>{platform?.[2] || '?'}</b>{platform?.[1] || item.platform}</span>}<span className={`status-badge status-${item.status || 'draft'}`}>{item.status || 'draft'}</span></div><time>{created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date unavailable'}</time></div>
            <p className="history-preview">{text.slice(0, 150)}{text.length > 150 ? '...' : ''}</p>
            <div className="history-actions">
              <button title="Copy content" onClick={() => copyContent(item)}>{copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}<span>{copiedId === item.id ? 'Copied' : 'Copy'}</span></button>
              <button title="Edit content" onClick={() => openGenerator(item)}><Pencil size={16} /><span>Edit</span></button>
              <button title="Schedule content" onClick={() => openScheduler(item)}><CalendarPlus size={16} /><span>Schedule</span></button>
              {['published', 'failed'].includes(item.status) && <button title="Republish content" onClick={() => openScheduler(item)}><RefreshCw size={16} /><span>Republish</span></button>}
              <button className="danger" title="Delete content" onClick={() => removeItem(item)}><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </article>;
        })}</div>
        {hasMore && <div className="load-more-wrap"><button className="btn-load-more" disabled={loadingMore} onClick={() => loadItems(true)}>{loadingMore ? 'Loading...' : 'Load more'}</button></div>}
      </>}
    </div></main>
  </div>;
}

export default ContentHistory;

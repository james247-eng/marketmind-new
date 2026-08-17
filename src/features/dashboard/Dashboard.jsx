import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CalendarClock, CheckCircle2, CircleX, FileClock, FileText, History, Link2, Plus, Send } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { getPlatformBreakdown, getPublishingActivity, getRecentPublishedContent, getRecentWorkspaceActivity, getWorkspaceOverview } from '../../services/analyticsService.js';
import './Dashboard.css';

const PLATFORM_LABELS = { facebook: 'Facebook', instagram: 'Instagram', twitter: 'Twitter/X', linkedin: 'LinkedIn', tiktok: 'TikTok', youtube: 'YouTube', unknown: 'Other' };
const PLATFORM_COLORS = { facebook: '#1877F2', instagram: '#E4405F', twitter: '#111827', linkedin: '#0077B5', tiktok: '#111827', youtube: '#FF0000', unknown: '#6B7280' };
const toDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);
const preview = (item, length = 115) => { const text = String(item.selectedVariant || item.content || item.prompt || 'Untitled content'); return `${text.slice(0, length)}${text.length > length ? '...' : ''}`; };

function PublishingChart({ data }) {
  const width = 700; const height = 240; const left = 36; const bottom = 35; const top = 20; const chartHeight = height - bottom - top; const slot = (width - left - 10) / data.length; const max = Math.max(1, ...data.map((item) => item.count));
  return <div className="activity-chart-wrap">{data.every((item) => item.count === 0) && <p className="chart-empty">No posts published in the last 7 days.</p>}<svg className="activity-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Posts published over the last seven days">
    {[0, .5, 1].map((ratio) => { const y = top + chartHeight * ratio; return <line key={ratio} x1={left} y1={y} x2={width - 10} y2={y} stroke="#E5E7EB" strokeWidth="1" />; })}
    {data.map((item, index) => { const barHeight = (item.count / max) * (chartHeight - 8); const x = left + index * slot + slot * .22; const y = top + chartHeight - barHeight; return <g key={item.key}><rect x={x} y={y} width={slot * .56} height={barHeight} rx="4" fill="#7C3AED" /><text x={x + slot * .28} y={Math.max(14, y - 6)} textAnchor="middle" fontSize="11" fill="#4B5563">{item.count}</text><text x={x + slot * .28} y={height - 10} textAnchor="middle" fontSize="12" fill="#6B7280">{item.label}</text></g>; })}
  </svg></div>;
}

function Dashboard() {
  const { workspaceId } = useParams(); const [sidebarOpen, setSidebarOpen] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [overview, setOverview] = useState({ contentThisMonth: 0, publishedThisMonth: 0, scheduled: 0, failed: 0, connectedPlatforms: 0 }); const [activity, setActivity] = useState([]); const [platforms, setPlatforms] = useState([]); const [published, setPublished] = useState([]); const [feed, setFeed] = useState([]);
  const loadDashboard = useCallback(async () => {
    if (!workspaceId) { setError('No workspace was selected.'); setLoading(false); return; } setLoading(true); setError('');
    const results = await Promise.all([getWorkspaceOverview(workspaceId), getPublishingActivity(workspaceId, 7), getPlatformBreakdown(workspaceId), getRecentPublishedContent(workspaceId), getRecentWorkspaceActivity(workspaceId)]);
    const failed = results.find((result) => !result.success); if (failed) setError(failed.error || 'Unable to load workspace analytics.');
    if (results[0].success) setOverview(results[0].overview); if (results[1].success) setActivity(results[1].activity); if (results[2].success) setPlatforms(results[2].platforms); if (results[3].success) setPublished(results[3].content); if (results[4].success) setFeed(results[4].activity); setLoading(false);
  }, [workspaceId]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const metrics = [
    ['Content this month', overview.contentThisMonth, FileText, '#EDE9FE', '#7C3AED'], ['Published this month', overview.publishedThisMonth, CheckCircle2, '#DCFCE7', '#16A34A'],
    ['Posts scheduled', overview.scheduled, CalendarClock, '#DBEAFE', '#2563EB'], ['Posts failed', overview.failed, CircleX, '#FEE2E2', '#DC2626'], ['Connected platforms', overview.connectedPlatforms, Link2, '#FEF3C7', '#B45309'],
  ];
  const actions = [[`/app/${workspaceId}/content`, Plus, 'Generate Content'], [`/app/${workspaceId}/calendar`, Send, 'Schedule Post'], [`/app/${workspaceId}/content/history`, History, 'View History'], [`/app/${workspaceId}/social`, Link2, 'Connect Platform']];
  return <div className="app"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content"><Header onMenuClick={() => setSidebarOpen(true)} /><div className="content-area">
    <div className="dashboard-header"><div><h1>Analytics Dashboard</h1><p>Workspace publishing and content activity at a glance.</p></div><div className="quick-actions">{actions.map(([path, Icon, label]) => <Link key={label} to={path}><Icon size={16} />{label}</Link>)}</div></div>
    {error && <div className="analytics-error"><AlertCircle size={18} />{error}<button onClick={loadDashboard}>Retry</button></div>}
    {loading ? <div className="stats-grid analytics-skeleton">{metrics.map(([label]) => <div className="stat-card" key={label}><span className="skeleton-icon" /><div><span /><span /></div></div>)}</div> : <div className="stats-grid">{metrics.map(([label, value, Icon, bg, color]) => <div className="stat-card" key={label}><div className="stat-icon" style={{ backgroundColor: bg }}><Icon size={23} color={color} /></div><div className="stat-content"><p className="stat-label">{label}</p><h3 className="stat-value">{value}</h3></div></div>)}</div>}
    {!loading && <div className="analytics-main-grid"><section className="chart-card publishing-chart-card"><div className="chart-header"><h3>Publishing activity</h3><p>Published posts over the last 7 days</p></div><PublishingChart data={activity} /></section>
      <section className="chart-card"><div className="chart-header"><h3>Platform breakdown</h3><p>Published posts by channel</p></div>{platforms.length ? <div className="platform-bars">{platforms.map((item) => <div key={item.platform}><div className="platform-bar-meta"><span><i style={{ backgroundColor: PLATFORM_COLORS[item.platform] }} />{PLATFORM_LABELS[item.platform] || item.platform}</span><strong>{item.count} · {item.percentage}%</strong></div><div className="platform-track"><span style={{ width: `${item.percentage}%`, backgroundColor: PLATFORM_COLORS[item.platform] }} /></div></div>)}</div> : <p className="section-empty">Publish your first post to see platform distribution.</p>}</section></div>}
    {!loading && <div className="analytics-detail-grid"><section className="analytics-panel"><div className="panel-heading"><div><h3>Recent published content</h3><p>Latest 10 published content items</p></div><Link to={`/app/${workspaceId}/content/history`}>View all</Link></div>{published.length ? <div className="published-table"><div className="published-row published-head"><span>Content</span><span>Platform</span><span>Published</span><span>Status</span></div>{published.map((item) => { const date = toDate(item.publishedAt || item.updatedAt || item.createdAt); return <div className="published-row" key={item.id}><span>{preview(item)}</span><span>{PLATFORM_LABELS[item.platform] || item.platform || 'Not set'}</span><span>{date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown'}</span><span className="published-status">Published</span></div>; })}</div> : <div className="section-empty"><FileClock size={28} /><p>No published content yet. Scheduled posts will appear here after publishing.</p></div>}</section>
      <section className="analytics-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Latest workspace actions</p></div></div>{feed.length ? <div className="activity-feed">{feed.map((item) => <div className={`feed-item feed-${item.type}`} key={item.id}><span className="feed-dot" /><div><strong>{item.label}</strong><p>{item.detail}</p><time>{item.date.toLocaleString()}</time></div></div>)}</div> : <div className="section-empty"><FileClock size={28} /><p>Generate or schedule content to start your activity feed.</p></div>}</section></div>}
  </div></main></div>;
}
export default Dashboard;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getConnectedAccounts } from '../../services/socialMediaService.js';
import { cancelScheduledPost, getScheduledPosts, reschedulePost, schedulePosts } from '../../services/schedulingService.js';
import COLLECTIONS from '../../lib/schema.js';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { AlertCircle, CalendarDays, CheckCircle, ChevronLeft, ChevronRight, Clock, List, Send, X } from 'lucide-react';
import './PostScheduler.css';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: 'IG' },
  { value: 'facebook', label: 'Facebook', icon: 'FB' },
  { value: 'twitter', label: 'Twitter/X', icon: 'X' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'IN' },
  { value: 'tiktok', label: 'TikTok', icon: 'TT' },
];

const emptyConfig = () => ({ platform: 'instagram', date: '', time: '', mediaUrl: '' });
const toDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const preview = (item) => String(item?.content || item?.prompt || 'Untitled content').slice(0, 110);

const validateJob = ({ platform, content, mediaUrl }) => {
  if (!content.trim()) return 'Content cannot be empty.';
  if (platform === 'instagram' && !mediaUrl) return 'Instagram requires an image or video URL.';
  if (platform === 'tiktok' && !mediaUrl) return 'TikTok requires a video URL.';
  if (platform === 'tiktok' && !/\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(mediaUrl)) return 'TikTok media must be a video URL (MP4, MOV, WebM, or M4V).';
  if (platform === 'twitter' && content.length > 280) return 'Twitter/X content cannot exceed 280 characters.';
  if (platform === 'linkedin' && content.length > 3000) return 'LinkedIn content cannot exceed 3000 characters.';
  return '';
};

function PostScheduler() {
  const { currentUser } = useAuth();
  const { workspaceId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [configs, setConfigs] = useState({});
  const [manualContent, setManualContent] = useState('');
  const [manualConfig, setManualConfig] = useState(emptyConfig);
  const [includeManual, setIncludeManual] = useState(false);
  const [view, setView] = useState('calendar');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(dateKey(new Date()));
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    if (!workspaceId || !currentUser) return;
    setLoading(true);
    setError('');
    try {
      const contentQuery = query(
        collection(db, COLLECTIONS.contentItems(workspaceId)),
        where('status', 'in', ['draft', 'approved'])
      );
      const [contentSnapshot, scheduledResult, accountsResult] = await Promise.all([
        getDocs(contentQuery),
        getScheduledPosts(workspaceId),
        getConnectedAccounts(currentUser.uid, workspaceId),
      ]);
      setContentItems(contentSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      if (!scheduledResult.success) throw new Error(scheduledResult.error);
      setJobs(scheduledResult.posts);
      if (accountsResult.success) setConnectedPlatforms([...new Set((accountsResult.accounts || []).map((item) => item.platform))]);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load scheduler data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, workspaceId]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateConfig = (id, field, value) => setConfigs((current) => ({
    ...current,
    [id]: { ...(current[id] || emptyConfig()), [field]: value },
  }));

  const toggleContent = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setConfigs((current) => current[id] ? current : { ...current, [id]: emptyConfig() });
  };

  const handleScheduleAll = async () => {
    const selectedItems = contentItems.filter((item) => selectedIds.includes(item.id));
    const pendingJobs = selectedItems.map((item) => ({
      contentItemId: item.id,
      content: item.content || '',
      mediaUrl: configs[item.id]?.mediaUrl || item.imageUrl || '',
      platform: configs[item.id]?.platform || 'instagram',
      scheduledAt: new Date(`${configs[item.id]?.date || ''}T${configs[item.id]?.time || ''}`),
    }));
    if (includeManual) pendingJobs.push({ contentItemId: null, content: manualContent, mediaUrl: manualConfig.mediaUrl, platform: manualConfig.platform, scheduledAt: new Date(`${manualConfig.date}T${manualConfig.time}`) });
    if (!pendingJobs.length) { setError('Select at least one content item or include manual content.'); return; }

    for (const job of pendingJobs) {
      if (Number.isNaN(job.scheduledAt.getTime()) || job.scheduledAt <= new Date()) { setError('Every selected item needs a future date and time.'); return; }
      const validation = validateJob(job);
      if (validation) { setError(validation); return; }
    }

    setSaving(true); setError(''); setSuccess('');
    const result = await schedulePosts(workspaceId, pendingJobs);
    if (result.success) {
      setSuccess(`${pendingJobs.length} post${pendingJobs.length === 1 ? '' : 's'} scheduled.`);
      setSelectedIds([]); setConfigs({}); setIncludeManual(false); setManualContent(''); setManualConfig(emptyConfig());
      await loadData();
    } else setError(result.error || 'Unable to schedule posts.');
    setSaving(false);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this scheduled post?')) return;
    const result = await cancelScheduledPost(workspaceId, id);
    if (result.success) setJobs((current) => current.map((job) => job.id === id ? { ...job, status: 'cancelled' } : job));
    else setError(result.error || 'Unable to cancel post.');
  };

  const handleReschedule = async (id) => {
    const nextDate = new Date(rescheduleValue);
    if (Number.isNaN(nextDate.getTime()) || nextDate <= new Date()) { setError('Choose a future date and time.'); return; }
    const result = await reschedulePost(workspaceId, id, nextDate);
    if (result.success) { setRescheduleId(null); setRescheduleValue(''); await loadData(); }
    else setError(result.error || 'Unable to reschedule post.');
  };

  const jobsByDay = useMemo(() => jobs.reduce((grouped, job) => {
    const scheduled = toDate(job.scheduledAt);
    if (!scheduled) return grouped;
    const key = dateKey(scheduled);
    grouped[key] = [...(grouped[key] || []), job];
    return grouped;
  }, {}), [jobs]);

  const calendarDays = useMemo(() => {
    const firstWeekday = month.getDay();
    const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: dayCount }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];
  }, [month]);

  const renderPost = (job) => {
    const scheduled = toDate(job.scheduledAt);
    const platform = PLATFORMS.find((item) => item.value === job.platform);
    return <div key={job.id} className="post-card">
      <div className="post-time"><span className="platform-icon">{platform?.icon || '?'}</span><Clock size={15} /><strong>{scheduled?.toLocaleString() || 'No date'}</strong></div>
      <p className="post-preview">{preview(job)}</p>
      <div className="post-footer"><span className={`status-badge status-${job.status}`}>{job.status}</span>
        {job.status === 'scheduled' && <div className="post-actions-inline"><button className="btn-secondary" onClick={() => setRescheduleId(job.id)}>Reschedule</button><button className="btn-cancel-post" onClick={() => handleCancel(job.id)}><X size={14} /> Cancel</button></div>}
      </div>
      {rescheduleId === job.id && <div className="reschedule-row"><input type="datetime-local" value={rescheduleValue} onChange={(event) => setRescheduleValue(event.target.value)} /><button className="btn-primary" onClick={() => handleReschedule(job.id)}>Save</button></div>}
    </div>;
  };

  return <div className="app">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <main className="main-content"><Header onMenuClick={() => setSidebarOpen(true)} /><div className="content-area">
      <div className="page-header"><div><h1>Schedule Posts</h1><p>Plan and publish content for this workspace.</p></div>
        <div className="view-toggle"><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays size={16} /> Calendar</button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16} /> List</button></div>
      </div>
      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}
      {loading ? <div className="scheduler-section">Loading scheduler...</div> : <>
        <section className="scheduler-section batch-section"><h3>Batch Schedule</h3>
          {contentItems.length === 0 && <p className="hint-text">No draft or approved content. <Link to={`/app/${workspaceId}/content`}>Generate content</Link></p>}
          <div className="batch-items">{contentItems.map((item) => { const config = configs[item.id] || emptyConfig(); const selected = selectedIds.includes(item.id); return <div key={item.id} className={`batch-item ${selected ? 'selected' : ''}`}>
            <label className="content-choice"><input type="checkbox" checked={selected} onChange={() => toggleContent(item.id)} /><span><strong>{item.prompt || 'Saved content'}</strong><small>{preview(item)}</small></span></label>
            {selected && <div className="batch-controls"><select value={config.platform} onChange={(event) => updateConfig(item.id, 'platform', event.target.value)}>{PLATFORMS.map((platform) => <option key={platform.value} value={platform.value}>{platform.label}{connectedPlatforms.includes(platform.value) ? '' : ' (not connected)'}</option>)}</select><input type="date" value={config.date} min={dateKey(new Date())} onChange={(event) => updateConfig(item.id, 'date', event.target.value)} /><input type="time" value={config.time} onChange={(event) => updateConfig(item.id, 'time', event.target.value)} /><input type="url" placeholder="Media URL when required" value={config.mediaUrl || item.imageUrl || ''} onChange={(event) => updateConfig(item.id, 'mediaUrl', event.target.value)} /></div>}
          </div>; })}</div>
          <div className="manual-entry"><label className="content-choice"><input type="checkbox" checked={includeManual} onChange={(event) => setIncludeManual(event.target.checked)} /><strong>Write new content manually</strong></label>{includeManual && <><textarea rows="4" value={manualContent} onChange={(event) => setManualContent(event.target.value)} placeholder="Write the final post content..." /><div className="batch-controls"><select value={manualConfig.platform} onChange={(event) => setManualConfig({ ...manualConfig, platform: event.target.value })}>{PLATFORMS.map((platform) => <option key={platform.value} value={platform.value}>{platform.label}</option>)}</select><input type="date" min={dateKey(new Date())} value={manualConfig.date} onChange={(event) => setManualConfig({ ...manualConfig, date: event.target.value })} /><input type="time" value={manualConfig.time} onChange={(event) => setManualConfig({ ...manualConfig, time: event.target.value })} /><input type="url" placeholder="Media URL when required" value={manualConfig.mediaUrl} onChange={(event) => setManualConfig({ ...manualConfig, mediaUrl: event.target.value })} /></div></>}</div>
          <button className="btn-schedule" disabled={saving} onClick={handleScheduleAll}><Send size={18} />{saving ? 'Scheduling...' : 'Schedule All'}</button>
        </section>
        <section className="scheduler-section calendar-section"><div className="calendar-header"><h3>{view === 'calendar' ? month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Publishing Jobs'}</h3>{view === 'calendar' && <div><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div>}</div>
          {view === 'calendar' ? <><div className="calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{calendarDays.map((day, index) => day ? <button key={dateKey(day)} className={`calendar-day ${selectedDay === dateKey(day) ? 'selected' : ''}`} onClick={() => setSelectedDay(dateKey(day))}><span>{day.getDate()}</span><small>{jobsByDay[dateKey(day)]?.length || ''}</small></button> : <span key={`empty-${index}`} />)}</div><div className="day-posts"><h4>Posts for {new Date(`${selectedDay}T12:00:00`).toLocaleDateString()}</h4>{(jobsByDay[selectedDay] || []).length ? jobsByDay[selectedDay].map(renderPost) : <p className="hint-text">No posts scheduled for this date.</p>}</div></> : <div className="posts-list">{jobs.length ? jobs.map(renderPost) : <p className="hint-text">No publishing jobs yet.</p>}</div>}
        </section>
      </>}
    </div></main>
  </div>;
}

export default PostScheduler;

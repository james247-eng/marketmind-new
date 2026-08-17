import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import COLLECTIONS from '../lib/schema.js';

const toDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);
const validDate = (value) => { const date = toDate(value); return date && !Number.isNaN(date.getTime()) ? date : null; };
const readCollection = async (path) => (await getDocs(collection(db, path))).docs.map((item) => ({ id: item.id, ...item.data() }));
const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

export const getWorkspaceOverview = async (workspaceId) => {
  try {
    const [contentItems, publishingJobs, connections] = await Promise.all([
      readCollection(COLLECTIONS.contentItems(workspaceId)),
      readCollection(COLLECTIONS.publishingJobs(workspaceId)),
      readCollection(COLLECTIONS.socialConnections(workspaceId)),
    ]);
    const monthStart = startOfMonth();
    const activePlatforms = new Set(connections.filter((item) => {
      const expiry = validDate(item.tokenExpiresAt);
      return item.status !== 'disconnected' && (!expiry || expiry > new Date());
    }).map((item) => item.platform));
    return { success: true, overview: {
      contentThisMonth: contentItems.filter((item) => (validDate(item.createdAt) || new Date(0)) >= monthStart).length,
      publishedThisMonth: publishingJobs.filter((item) => item.status === 'published' && (validDate(item.publishedAt || item.scheduledAt || item.updatedAt) || new Date(0)) >= monthStart).length,
      scheduled: publishingJobs.filter((item) => item.status === 'scheduled').length,
      failed: publishingJobs.filter((item) => item.status === 'failed').length,
      connectedPlatforms: activePlatforms.size,
    } };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getPublishingActivity = async (workspaceId, days = 7) => {
  try {
    const jobs = await readCollection(COLLECTIONS.publishingJobs(workspaceId));
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const activity = Array.from({ length: days }, (_, index) => {
      const date = new Date(today); date.setDate(today.getDate() - (days - 1 - index)); date.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString(undefined, { weekday: 'short' }), date, end, count: 0 };
    });
    jobs.filter((item) => item.status === 'published').forEach((item) => {
      const date = validDate(item.scheduledAt); const bucket = date && activity.find((day) => date >= day.date && date <= day.end); if (bucket) bucket.count += 1;
    });
    return { success: true, activity: activity.map(({ key, label, count }) => ({ key, label, count })) };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getPlatformBreakdown = async (workspaceId) => {
  try {
    const jobs = await readCollection(COLLECTIONS.publishingJobs(workspaceId)); const counts = {};
    jobs.filter((item) => item.status === 'published').forEach((item) => { const platform = item.platform || 'unknown'; counts[platform] = (counts[platform] || 0) + 1; });
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return { success: true, platforms: Object.entries(counts).map(([platform, count]) => ({ platform, count, percentage: total ? Math.round((count / total) * 100) : 0 })).sort((a, b) => b.count - a.count) };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getRecentPublishedContent = async (workspaceId) => {
  try {
    const items = await readCollection(COLLECTIONS.contentItems(workspaceId));
    return { success: true, content: items.filter((item) => item.status === 'published').sort((a, b) => (validDate(b.createdAt)?.getTime() || 0) - (validDate(a.createdAt)?.getTime() || 0)).slice(0, 10) };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getRecentWorkspaceActivity = async (workspaceId) => {
  try {
    const [contentItems, jobs] = await Promise.all([readCollection(COLLECTIONS.contentItems(workspaceId)), readCollection(COLLECTIONS.publishingJobs(workspaceId))]);
    const contentEvents = contentItems.map((item) => ({ id: `content-${item.id}`, type: 'generated', label: 'Content generated', detail: String(item.content || item.prompt || 'New content').slice(0, 90), date: validDate(item.updatedAt || item.createdAt) }));
    const jobEvents = jobs.filter((item) => ['scheduled', 'published', 'failed'].includes(item.status)).map((item) => ({ id: `job-${item.id}`, type: item.status, label: item.status === 'published' ? 'Post published' : item.status === 'failed' ? 'Post failed' : 'Post scheduled', detail: `${item.platform || 'Platform'}: ${String(item.content || 'Scheduled post').slice(0, 70)}`, date: validDate(item.updatedAt || item.publishedAt || item.createdAt || item.scheduledAt) }));
    return { success: true, activity: [...contentEvents, ...jobEvents].filter((item) => item.date).sort((a, b) => b.date - a.date).slice(0, 20) };
  } catch (error) { return { success: false, error: error.message }; }
};

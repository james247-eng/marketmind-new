// analyticsService.js
// Fetch analytics from social media platforms

import { auth } from './firebase';

const fetchAnalytics = async (platform, accountId, workspaceId) => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return { success: false, error: 'You must be signed in to fetch analytics' };
  try {
    const response = await fetch('/.netlify/functions/fetch-analytics', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ platform, accountId, workspaceId }) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Analytics request failed');
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
export const getFacebookInsights = (pageId, workspaceId) => fetchAnalytics('facebook', pageId, workspaceId);
export const getInstagramInsights = (accountId, workspaceId) => fetchAnalytics('instagram', accountId, workspaceId);
export const getTwitterAnalytics = (accountId, workspaceId) => fetchAnalytics('twitter', accountId, workspaceId);
export const getTikTokAnalytics = (accountId, workspaceId) => fetchAnalytics('tiktok', accountId, workspaceId);
export const getYouTubeAnalytics = (accountId, workspaceId) => fetchAnalytics('youtube', accountId, workspaceId);

// Aggregate all platform analytics
export const getAllPlatformAnalytics = async (connectedAccounts) => {
  const analytics = {
    totalFollowers: 0,
    totalPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    platformBreakdown: []
  };

  for (const account of connectedAccounts) {
    let platformData;

    switch (account.platform) {
      case 'facebook':
        platformData = await getFacebookInsights(account.accountId, account.workspaceId);
        if (platformData.success) {
          analytics.platformBreakdown.push({
            platform: 'Facebook',
            followers: platformData.data.page_fans || 0,
            engagement: platformData.data.page_engaged_users || 0,
            reach: platformData.data.page_impressions || 0
          });
        }
        break;

      case 'instagram':
        platformData = await getInstagramInsights(account.accountId, account.workspaceId);
        if (platformData.success) {
          analytics.platformBreakdown.push({
            platform: 'Instagram',
            followers: platformData.data.follower_count || 0,
            engagement: platformData.data.profile_views || 0,
            reach: platformData.data.impressions || 0
          });
        }
        break;

      case 'twitter':
        platformData = await getTwitterAnalytics(account.accountId, account.workspaceId);
        if (platformData.success) {
          analytics.platformBreakdown.push({
            platform: 'Twitter',
            followers: platformData.data.public_metrics?.followers_count || 0,
            engagement: platformData.data.public_metrics?.tweet_count || 0,
            reach: 0
          });
        }
        break;

      case 'tiktok':
        platformData = await getTikTokAnalytics(account.accountId, account.workspaceId);
        if (platformData.success) {
          analytics.platformBreakdown.push({
            platform: 'TikTok',
            followers: platformData.data.follower_count || 0,
            engagement: platformData.data.likes_count || 0,
            reach: platformData.data.video_views || 0
          });
        }
        break;

      case 'youtube':
        platformData = await getYouTubeAnalytics(account.accountId, account.workspaceId);
        if (platformData.success) {
          analytics.platformBreakdown.push({
            platform: 'YouTube',
            followers: platformData.data.subscriberCount || 0,
            engagement: platformData.data.commentCount || 0,
            reach: platformData.data.viewCount || 0
          });
        }
        break;
    }
  }

  // Calculate totals
  analytics.totalFollowers = analytics.platformBreakdown.reduce((sum, p) => sum + p.followers, 0);
  analytics.totalEngagement = analytics.platformBreakdown.reduce((sum, p) => sum + p.engagement, 0);
  analytics.totalReach = analytics.platformBreakdown.reduce((sum, p) => sum + p.reach, 0);

  return analytics;
};

// Generate mock data for demo (when APIs not connected)
export const getMockAnalytics = () => {
  return {
    totalFollowers: 15420,
    totalPosts: 127,
    totalEngagement: 8934,
    totalReach: 45780,
    platformBreakdown: [
      { platform: 'Facebook', followers: 5200, engagement: 3450, reach: 18900, color: '#1877F2' },
      { platform: 'Instagram', followers: 6800, engagement: 4120, reach: 21300, color: '#E4405F' },
      { platform: 'Twitter', followers: 2100, engagement: 890, reach: 3200, color: '#1DA1F2' },
      { platform: 'TikTok', followers: 1320, engagement: 474, reach: 2380, color: '#000000' }
    ],
    weeklyData: [
      { day: 'Mon', posts: 4, engagement: 1200, reach: 5600 },
      { day: 'Tue', posts: 3, engagement: 980, reach: 4300 },
      { day: 'Wed', posts: 5, engagement: 1450, reach: 6700 },
      { day: 'Thu', posts: 2, engagement: 720, reach: 3200 },
      { day: 'Fri', posts: 6, engagement: 1680, reach: 7800 },
      { day: 'Sat', posts: 4, engagement: 1340, reach: 6100 },
      { day: 'Sun', posts: 3, engagement: 1010, reach: 4900 }
    ],
    topPosts: [
      { content: 'New product launch! Check out our latest...', platform: 'Instagram', likes: 1250, comments: 89, shares: 34 },
      { content: 'Behind the scenes at our office today...', platform: 'Facebook', likes: 980, comments: 67, shares: 28 },
      { content: '5 tips to boost your productivity 🚀', platform: 'Twitter', likes: 756, comments: 45, shares: 52 }
    ]
  };
};
